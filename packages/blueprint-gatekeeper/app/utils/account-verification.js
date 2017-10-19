'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , mongoose    = require ('mongoose')
  , async       = require ('async')
  ;

let token = null;

const DEFAULT_TOKEN_SUBJECT = 'gatekeeper:account:activation';
const DEFAULT_EXPIRES_IN = '7d';
const DEFAULT_ISSUER = 'gatekeeper:activator';

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
        payload: {},
        options: {
          jwtid: account.verification.toString (),
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
 *
 * @param token
 */
exports.verifyToken = function (token) {

};
