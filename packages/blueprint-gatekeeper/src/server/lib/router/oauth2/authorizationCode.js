var passport    = require ('passport')
  , express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  , uid         = require ('uid-safe')
  ;

var BaseGrantRouter = require ('./baseGrantRouter')
  , AccessToken     = require ('../../models/oauth2/accessToken')
  , Account         = require ('../../models/account');

passport.use (require ('../../authentication/client') ());

function AuthorizationCodeRouter (opts, server) {
  this._server = server;
  this._opts = opts || {};

  this._tokenLength = this._opts.tokenLength || 256;
  this._codeLength = this._opts.codeLength || 16;

  // Initialize the grant for this router.
  var self = this;

  this._server.grant ('code',
    oauth2orize.grant.code (function (client, redirect_uri, user, ares, done) {
      var code = uid.sync (self._codeLength);

      // Store the authorization code in the database. We are going to have
      // to retrieve it later when giving out the token.
      var ac = new oauth2.AuthorizationCode ({
        code : code,
        client : client.id,
        redirect_uri : redirect_uri,
        account : user.id
      });

      ac.save (function (err) {
        return err ? done (err) : done (null, code);
      });
    }));

  // Initialize the exchange for this router.

  this._server.exchange ('code',
    oauth2orize.exchange.code (function (client, code, redirect_uri, done) {
      // Make sure the client is not disabled before we continue with
      // exchanging the code for one or more token.
      if (client.disabled)
        return done (null, false);

      winston.log ('info', 'client %s exchanging authorization code for access token', client.id);
      var query = {code : code, client : client.id, redirect_uri : redirect_uri };

      oauth2.AuthorizationCode.findOne (query, function (err, code) {
        // Make sure there were no error, and we actually found an entry that
        // matched our criteria.
        if (err)
          return done (err);

        if (!code)
          return done (null, false);

        // Remove the entry from the database since it is no longer needed.
        // We then are going to convert the entry into an access token that
        // can be returned to the client. The token will then be used by the
        // client to access the APIs.
        code.remove (function (err, code) {
          if (err)
            return done (err);

          AccessToken.generateAndSave (done);
        });
      });
    }));
}

/**
 * Create handler method to ensure the user is logged in.
 *
 * @returns {Function}
 */
AuthorizationCodeRouter.prototype.ensureLoggedIn = function () {
  return function (req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated ())
      return res.send (401, {message: 'User is not logged in'});

    return next ();
  }
};

/**
 * Finalize user authorization to receiving a token that can be used to access
 * protected resources.
 *
 * @returns {Function}
 */
AuthorizationCodeRouter.prototype.respondWithTransaction = function () {
  return function (req, res) {
    winston.info ('finalizing the authorization request');

    res.send (200, {
      transactionID: req.oauth2.transactionID,
      user: {
        id: req.user.id,
        username : req.user.username
      },
      client: {
        id : req.oauth2.client.id,
        name : req.oauth2.client.name,
      }
    });
  };
};


AuthorizationCodeRouter.prototype.appendRouter = function () {
  var router = express.Router ();


  // We support the code authentication. The flow for this authentication is:
  //
  // (1) login the user with their username/password
  // (2) authorize the client
  // (3) decide if the third-party has access
  // (4) exchange the code for an access token

  router.post('/oauth2/login',
    [
      passport.authenticate ('local'),
      function (req, res) {return res.send(200, {}); }
    ]
  );

  router.get('/oauth2/authorize',
    [
      this.ensureLoggedIn (),
      passport.authenticate ('oauth2-client', { session : false }),
      this.respondWithTransaction (),
      this._server.errorHandler ({ mode: 'indirect' })
    ]
  );

  router.post('/oauth2/decision',
    [
      this.ensureLoggedIn (),
      this._server.decision (),
      this._server.errorHandler ({ mode: 'indirect' })
    ]
  );

  return router;
}

module.exports = exports = function (opts) {
  return new Oauth20Router (opts).get ();
};
