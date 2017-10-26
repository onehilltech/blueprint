'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , mongoose    = require ('mongoose')
  , async       = require ('async')
  , Account     = require ('../../app/models/Account')
  ;

let token = null;

const DEFAULT_ISSUER = 'gatekeeper.verifier';
const DEFAULT_TOKEN_SUBJECT = 'gatekeeper.account.verification';
const DEFAULT_EXPIRES_IN = '7d';

blueprint.messaging.on ('app.init', function (app) {
  token = require ('../../lib/tokens') (app.configs.gatekeeper.token);
});

/**
 * Generate a token for account activation.
 *
 * @param account
 */
exports.generateToken = function (account, callback) {
  async.waterfall ([
    function (callback) {
      account.verification = new mongoose.Types.ObjectId ();
      account.save (callback);
    },

    function (account, n, callback) {
      let opts = {
        payload: {
          email: account.email
        },
        options: {
          jwtid: account.id,
          issuer: DEFAULT_ISSUER,
          subject: DEFAULT_TOKEN_SUBJECT,
          expiresIn: DEFAULT_EXPIRES_IN
        }
      };

      token.generateToken (opts, callback);
    }
  ], callback);
};

/**
 * Verify the token for activating the account.
 */
exports.verifyToken = function (value, callback) {
  async.waterfall ([
    function (callback) {
      let opts = {
        issuer: DEFAULT_ISSUER,
        subject: DEFAULT_TOKEN_SUBJECT,
      };

      token.verifyToken (value, opts, callback);
    },

    function (payload, callback) {
      let {email, jti} = payload;
      Account.findOne ({_id: jti, email}, callback);
    },

    function (account, callback) {
      account.verified_at = new Date ();
      account.save (callback);
    }
  ], callback);
};
