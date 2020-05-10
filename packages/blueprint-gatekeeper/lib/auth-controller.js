const {
  Controller,
  model,
  service
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  /**
   * The action for authenticating a user.
   *
   * @returns {Promise<unknown[]>|boolean|TokenGenerator|void}
   */
  authenticate () {
    return Action.extend ({
      /// Bind the the session service for generating user sessions.
      session: service (),

      /// Bind to the account model for managing user accounts.
      Account: model ('account'),

      /// The default token type for the generated token.
      tokenType: 'Bearer',

      execute (req, res) {
        return Promise.resolve (this.authenticate (req))
          .then (user => Promise.all ([
            this.getClientId (req),
            this.getUserCredentials (req, user),
            this.prepareTokenOptions (req, user),
            this.prepareTokenPayload (req, user)
          ]))
          .then (([clientId, credentials, options, payload]) =>
            this._findOrCreateAccount (credentials.username, credentials.password)
              .then (account => this.session.issueToken (clientId, account, payload, options))
              .then (token => res.status (200).json (Object.assign ({token_type: this.tokenType}, token))));
      },

      authenticate (req) {
        return true;
      },

      getClientId (req) {
        return req.body.client_id;
      },

      getUserCredentials (req, user) {
        return {
          username: user.username,
          password: user.password
        }
      },

      prepareTokenOptions (req, user) {

      },

      prepareTokenPayload (req, user) {

      },

      /**
       * Find or create an account for the user in Gatekeeper.
       *
       * @param email
       * @param password
       * @returns {void|PromiseLike<any>|Promise<any>}
       * @private
       */
      _findOrCreateAccount (email, password) {
        return this.session.findAccountByEmail (email)
          .then (account => !!account ? account : this.Account.create ({email, username: email, password}));
      },

    })
  }
});