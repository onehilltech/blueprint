const { Service, BlueprintObject, BlueprintError } = require ('@onehilltech/blueprint');
const { Types: { ObjectId }} = require ('@onehilltech/blueprint-mongodb');
const { union } = require ('lodash');
const moment = require ('moment');

/**
 * @class Issuer
 *
 * The abstraction that can issue/verify user and client tokens.
 */
const Issuer = BlueprintObject.extend ({
  /// The token generator used for the issuer to generate/verify tokens.
  tokenGenerator: null,

  /// Reference to the access token model.
  AccessToken: null,

  /**
   * Issue a client token.
   *
   * @param client
   * @param payload
   * @param opts
   */
  issueClientToken (client, payload, opts, serialize = true) {
    // First, make sure we are able to issue a token for the client. The client must
    // be enabled. It also must not be a private client, which requires a user.

    if (client.is_deleted)
      return Promise.reject (new BlueprintError ('invalid_client', 'The client no longer exists.'));

    if (!client.enabled)
      return Promise.reject (new BlueprintError ('client_disabled', 'The client is disabled.'));

    if (client.restricted)
      return Promise.reject (new BlueprintError ('restricted_client', 'The client cannot issue access tokens for anonymous users.'));

    // Initialize the client token document.
    let doc = { client, scope : client.scope, payload };
    doc = this._initTokenDocument (doc, opts || {});
    doc = this._initTokenExpiration (doc, client, opts || {});

    const { discriminators: { client_token: ClientToken }} = this.AccessToken;
    return ClientToken.create (doc).then (clientToken => serialize ? clientToken.serialize (this.tokenGenerator) : clientToken);
  },

  /**
   * Issue user token.
   *
   * @param client
   * @param account
   * @param payload
   * @param opts
   * @param serialize
   */
  issueUserToken (account, client, payload = {}, opts = {}, serialize = true) {
    // First, make sure we are able to issue a token for the user on the target client.
    // The client and the user must be enabled. If the client is a restricted client, then
    // the user must be allowed to use the client.

    if (client.is_deleted)
      return Promise.reject (new BlueprintError ('invalid_client', 'The client no longer exists.'));

    if (!client.enabled)
      return Promise.reject (new BlueprintError ('client_disabled', 'The client is disabled.'));

    if (account.is_deleted)
      return Promise.reject (new BlueprintError ('invalid_account', 'The user account no longer exists.'));

    if (!account.enabled)
      return Promise.reject (new BlueprintError ('account_disabled', 'The user account is disabled.'));

    if (client.restricted && !client.allowed (account))
      return Promise.reject (new BlueprintError ('unauthorized_user', 'The user account is not allowed to access this client.'));

    // Initialize the user token document.

    let scope = union (client.scope, account.scope, opts.scope);
    let doc = { account, client, scope, payload };
    doc = this._initTokenDocument (doc, opts || {});
    doc = this._initTokenExpiration (doc, client, opts || {});

    let refreshTokenGenerator;

    if (!!opts.refreshable) {
      // The user token is refreshable. Add the refresh token id the document, and
      // create the refresh token generator.

      doc.refresh_token = new ObjectId ();
      refreshTokenGenerator = this.tokenGenerator.extend ({ options: opts.refreshable});
    }

    const { discriminators: { user_token: UserToken }} = this.AccessToken;
    return UserToken.create (doc).then (userToken => serialize ? userToken.serialize (this.tokenGenerator, refreshTokenGenerator) : userToken);
  },

  /**
   * Verify an JSON web token.
   *
   * @param token
   * @param opts
   * @returns A promise that resolves the payload in the token.
   */
  async verifyToken (token, opts) {
    return this.tokenGenerator.verifyToken (token, opts)
      .then (payload => this.AccessToken.findById (payload.jti).populate ('client account').exec ())
      .then (accessToken => this._checkAccessToken (accessToken, opts))
      .catch (this._handleTokenError.bind (this));
  },

  /**
   * Verify a refresh token.
   *
   * @param token
   * @param opts
   */
  verifyRefreshToken (token, opts) {
    return this.tokenGenerator.verifyToken (token, opts)
      .then (payload => this.AccessToken.findOne ({refresh_token: new ObjectId (payload.jti)}).populate ('client account').exec ())
      .then (accessToken => this._checkAccessToken (accessToken, opts))
      .catch (this._handleTokenError.bind (this));
  },

  /**
   * Handle errors generated from token verification.
   *
   * @param err
   * @private
   */
  _handleTokenError (err) {
    // Translate the error, if necessary. We have to check the name because the error
    // could be related to token verification.
    if (err.name === 'TokenExpiredError')
      return Promise.reject (new BlueprintError ('token_expired', 'The access token has expired.'));

    if (err.name === 'JsonWebTokenError')
      return Promise.reject (new BlueprintError ('invalid_token', err.message));

    return Promise.reject (err);
  },

  /**
   * Check the state of the access token to make sure it is usable.
   *
   * @param accessToken
   * @private
   */
  _checkAccessToken (accessToken, opts = {}) {
    if (!accessToken)
      return Promise.reject (new BlueprintError ('unknown_token', 'The access token is unknown.'));

    if (!accessToken.enabled)
      return Promise.reject (new BlueprintError ('token_disabled', 'The access token is disabled.'));

    if (!accessToken.client)
      return Promise.reject (new BlueprintError ('unknown_client', 'The client is unknown.'));

    if (accessToken.client.enabled === false)
      return Promise.reject (new BlueprintError ('client_disabled', 'The client is disabled.'));

    if (accessToken.client.is_deleted)
      return Promise.reject (new BlueprintError ('client_deleted', 'The client has been deleted.'));

    if (accessToken.maxUsageLimit ())
      return Promise.reject (new BlueprintError ('max_usage_limit', 'The access token has reached its max usage limit.'));

    // Let's make sure the request is originate from the same address that was
    // used to create the request.
    const { origin } = opts;

    if (!!accessToken.origin && !!origin && accessToken.origin !== origin)
      return Promise.reject (new BlueprintError ('invalid_origin', 'The origin for the access token is invalid.'));

    if (accessToken.type === 'user_token') {
      // These are checks that pertain only to an user access token.

      if (!accessToken.account)
        return Promise.reject (new BlueprintError ('unknown_account', 'The user account is unknown.'));

      if (!accessToken.account.enabled)
        return Promise.reject (new BlueprintError ('account_disabled', 'The user account is disabled.'));

      if (accessToken.account.is_deleted)
        return Promise.reject (new BlueprintError ('account_deleted', 'The user account has been deleted.'));
    }

    return accessToken;
  },

  /**
   * Initialize the base token document from the options.
   *
   * @param doc
   * @param opts
   * @returns {*}
   * @private
   */
  _initTokenDocument (doc, opts) {
    if (!!opts.origin)
      doc.origin = opts.origin;

    if (!!opts.audience)
      doc.audience = opts.audience;

    if (!!opts.subject)
      doc.subject = opts.subject;

    if (!!this.tokenGenerator.options.issuer)
      doc.issuer = this.tokenGenerator.options.issuer;

    return doc;
  },

  /**
   * Initialize the expiration for the token document.
   *
   * @param doc
   * @param client
   * @returns {*}
   * @private
   */
  _initTokenExpiration (doc, client, opts) {
    // Get the current expiration. The expiration in the options takes precedence over
    // the expiration provided with the client.

    const expiration = opts.expiration || client.expiration;

    if (!expiration)
      return doc;

    // Compute the expiration date for the access token. The expiration statement
    // in the client is a relative time phrase (i.e., 1 day, 60 seconds, etc) from
    // the current time.

    const parts = expiration.split (' ');
    doc.expiration = moment ().add (...parts).toDate ();

    return doc;
  }
});

/**
 * @class issuer
 *
 * A service that issues client and user tokens.
 */
module.exports = Service.extend ({
  /// The default issuer used by the service to issue/verify tokens.
  _defaultIssuer: null,

  /**
   * Configure the service.
   */
  configure () {
    const { tokenGenerator } = this.app.lookup ('service:gatekeeper');
    this._defaultIssuer = this._makeIssuerForTokenGenerator (tokenGenerator);
  },
  
  /**
   * Issue a client token.
   *
   * @param client
   * @param payload
   * @param opts
   */
  issueClientToken (client, payload, opts, serialize) {
    return this._defaultIssuer.issueClientToken (client, payload, opts, serialize);
  },

  /**
   * Issue user token.
   *
   * @param client
   * @param account
   * @param payload
   * @param opts
   * @param serialize
   */
  issueUserToken (account, client, payload = {}, opts = {}, serialize) {
    return this._defaultIssuer.issueUserToken (account, client, payload, opts, serialize);
  },

  /**
   * Verify a JSON web token.
   *
   * @param token
   * @returns A promise that resolves the payload in the token.
   */
  verifyToken (token, opts) {
    return this._defaultIssuer.verifyToken (token, opts);
  },

  /**
   * Verify a JSON web token used for refreshing.
   *
   * @param token
   * @returns {*}
   */
  verifyRefreshToken (token, opts) {
    return this._defaultIssuer.verifyRefreshToken (token, opts);
  },

  /**
   * Factory method for creating new issuer objects.
   *
   * @param tokenGenerator
   * @private
   */
  _makeIssuerForTokenGenerator (tokenGenerator) {
    const AccessToken = this.app.lookup ('model:access-token');
    return new Issuer ({tokenGenerator, AccessToken })
  }
});
