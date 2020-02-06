const { Service, BlueprintObject } = require ('@onehilltech/blueprint');
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
  issueClientToken (client, payload, opts) {
    // First, make sure we are able to issue a token for the client. The client must
    // be enabled. It also must not be a private client, which requires a user.

    if (client.is_deleted)
      return Promise.reject (new Error ('The client no longer exists.'));

    if (!client.enabled)
      return Promise.reject (new Error ('The client is disabled.'));

    if (client.restricted)
      return Promise.reject (new Error ('The client cannot issue access tokens for anonymous users.'));

    // Initialize the client token document.
    let doc = { client, scope : client.scope, payload };
    doc = this._initTokenDocument (doc, opts || {});
    doc = this._initTokenExpiration (doc, client, opts || {});

    const { discriminators: { client_token: ClientToken }} = this.AccessToken;
    return ClientToken.create (doc).then (clientToken => clientToken.serialize (this.tokenGenerator));
  },

  /**
   * Issue user token.
   *
   * @param client
   * @param account
   * @param payload
   * @param opts
   */
  issueUserToken (account, client, payload = {}, opts = {}) {
    // First, make sure we are able to issue a token for the user on the target client.
    // The client and the user must be enabled. If the client is a restricted client, then
    // the user must be allowed to use the client.

    if (client.is_deleted)
      return Promise.reject (new Error ('The client no longer exists.'));

    if (!client.enabled)
      return Promise.reject (new Error ('The client is disabled.'));

    if (account.is_deleted)
      return Promise.reject (new Error ('The user account no longer exists.'));

    if (!account.enabled)
      return Promise.reject (new Error ('The user account is disabled.'));

    if (client.restricted && !client.allowed (account))
      return Promise.reject (new Error ('The user account is not allowed to access this client.'));

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
    return UserToken.create (doc).then (userToken => userToken.serialize (this.tokenGenerator, refreshTokenGenerator));
  },

  /**
   * Verify an JSON web token.
   *
   * @param token
   * @returns A promise that resolves the payload in the token.
   */
  verifyToken (token, opts) {
    return this.tokenGenerator.verifyToken (token, opts)
      .then (payload => this.AccessToken.findById (payload.jti));
  },

  /**
   * Verify a refresh token.
   *
   * @param token
   * @param opts
   */
  verifyRefreshToken (token, opts) {
    return this.tokenGenerator.verifyToken (token, opts)
      .then (payload => this.AccessToken.findOne ({refresh_token: new ObjectId (payload.jti)}));
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
  issueClientToken (client, payload, opts) {
    return this._defaultIssuer.issueClientToken (client, payload, opts);
  },

  /**
   * Issue user token.
   *
   * @param client
   * @param account
   * @param payload
   * @param opts
   */
  issueUserToken (account, client, payload = {}, opts = {}) {
    return this._defaultIssuer.issueUserToken (account, client, payload, opts);
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
