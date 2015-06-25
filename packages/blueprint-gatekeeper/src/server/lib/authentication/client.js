/**
 * Module dependencies.
 */
var passport = require('passport-strategy')
  , util = require ('util')
  , winston = require ('winston')
  , Client = require ('../models/oauth2/client');


/**
 * `ClientPasswordStrategy` constructor.
 *
 * @api protected
 */
function ClientStrategy (options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify)
    throw new Error('OAuth 2.0 client strategy requires a verify function');

  passport.Strategy.call (this);
  this.name = 'oauth2-client';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.ClientStrategy`.
 */
util.inherits (ClientStrategy, passport.Strategy);

/**
 * Authenticate request based on client id in the request body.
 *
 * @param {Object} req
 * @api protected
 */
ClientStrategy.prototype.authenticate = function(req) {
  if (!req.body || !req.body['client_id'])
    return this.fail();

  var clientId = req.body['client_id'];
  var self = this;

  function verified (err, client, info) {
    if (err) { return self.error(err); }
    if (!client) { return self.fail(); }
    self.success (client, info);
  }

  if (self._passReqToCallback) {
    this._verify(req, clientId, verified);
  } else {
    this._verify(clientId, verified);
  }
}

module.exports = exports = function () {
  return new ClientStrategy (function (id, done) {
      try {
        winston.info ('authorizing/authenticating login client ' + id);

        Client.findById(id, function (err, client) {
          if (err)
            return done(err);

          if (!client)
            return done(null, false);

          if (client.disabled)
            return done(null, false);

          winston.info ('login client ' + id + ' authorization/authentication successful');
          return done (null, client);
        });
      }
      catch (err) {
        console.log (err.message);
      }
    });
};
