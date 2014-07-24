var passport      = require ('passport'),
    express       = require ('express'),
    oauth2orize   = require ('oauth2orize'),
    login         = require ('connect-ensure-login'),
    client        = require ('../authentication/client'),
    oauth2model   = require ('../models/oauth2');

var TOKEN_LENGTH = 256;

// Create OAuth 2.0 server
var server = oauth2orize.createServer ();

// Serialization/deserialization
server.serializeClient (function (client, done) {
  return done (null, client._id.toString ());
});

server.deserializeClient (function (id, done) {
  oauth2model.Client.findById (id, function (err, client) {
    return err ? done (err) : done (null, client);
  });
});

function generateToken (len) {
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push (chars[getRandomInt (0, charlen - 1)]);
  }

  return buf.join ('');
}

function getRandomInt (min, max) {
  return Math.floor (Math.random () * (max - min + 1)) + min;
}

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

// Authorization Codes
server.grant ('code', oauth2orize.grant.code (function (client, redirect_uri, user, ares, done) {
  // Generate a new authorization code.
  var code = generateToken (16);

  // Store the authorization code in the database. We are going to have
  // to retrieve it later when giving out the token.
  var ac = new oauth2model.AuthorizationCode ({
    code : code,
    client : client.id,
    redirect_uri : redirect_uri,
    account : user.id
  });

  ac.save (function (err) {
    return err ? done (err) : done (null, code);
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange ('code', oauth2orize.exchange.code (function (client, code, redirect_uri, done) {
  // Make sure the client is not disabled before we continue with
  // exchanging the code for one or more token.
  if (client.disabled)
    return done (null, false);

  var query = {
    code : code,
    client : client.id,
    redirect_uri : redirect_uri,
  };

  oauth2model.AuthorizationCode.findOne (query, function (err, code) {
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

      var token = generateToken (TOKEN_LENGTH);
      var refresh_token = generateToken (TOKEN_LENGTH);

      var access_token = new oauth2model.AccessToken ({
        token : token,
        refresh_token : refresh_token,
        account : code.account,
        client : code.client
      });

      access_token.save (function (err) {
        return err ? done (err) : done (null, token, refresh_token);
      });
    });
  });
}));

server.exchange ('refresh_token', oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
  // Make sure the client is allowed to refresh its token. We do not want
  // to allow unauthorized clients access to protected resources.
  if (client.disabled)
    return done (null, false);

  // Locate the original access token that corresponds to this refresh
  // token. If we cannot find the original access token, then we need to
  // return an error to the user.
  oauth2model.AccessToken.findOne ({client : client.id, refresh_token: refresh_token}, function (err, at) {
    if (err)
      return done (err);

    if (!at)
      return done (null, false);

    // Generate a new token and refresh token.
    at.token = generateToken (TOKEN_LENGTH);
    at.refresh_token = generateToken (TOKEN_LENGTH);

    at.save (function (err) {
      return err ? done (err) : done (null, at.token, at.refresh_token);
    });
  });
}));

// Use the client authentication strategy.
passport.use (client ());

// Configure the router to support the paths in this module. All the 
// paths in this module begin with /auth. Any other path is not part 
// of this module.

module.exports = exports = function (opts) {
  console.log ('configuring OAuth 2.0 routes');

  opts = opts || {};
  var router = express.Router ();

  router.get ('/oauth2/authorize', [
      login.ensureLoggedIn (),
      server.authorization (function (client_id, redirect_uri, done) {
        oauth2model.Client.findById (client_id, function (err, client) {
          if (err)
            return done (err);

          // For security purposes,check that redirect URI provided by the
          // client matches one registered with the server. 
          if (client.redirect_uri !== redirect_uri)
            return done (new Error ('redirect uri does not match'));

          // Make sure the client is not disabled before we begin a new transaction
          // for authorizing access to our protected resources.
          if (client.disabled)
            return done (new Error ('client access is disabled'));

          return done (null, client, redirect_uri);
        });
      }),
      function (req, res) {
        res.send (200, { 
          transactionID: req.oauth2.transactionID, 
          user: {
            id: req.user.id,
            email : req.user.email,
          }, 
          client: {
            id : req.oauth2.client.id,
            name : req.oauth2.client.name,
          }
        });
      }
    ]
  );

  router.post ('/oauth2/decision', 
    [ login.ensureLoggedIn (),
      server.decision () ]);

  router.post ('/oauth2/token', 
    [ passport.authenticate (['oauth2-client-password'], { session: false }),
      server.token (),
      server.errorHandler () ]);

  return router;
};



