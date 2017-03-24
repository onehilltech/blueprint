'use strict';

const async   = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  , ObjectId  = mongodb.Types.ObjectId
  , HttpError = blueprint.errors.HttpError
  , _         = require ('underscore')
  , Account   = require ('../../models/Account')
  , UserToken = require ('../../models/UserToken')
  ;

var exports = module.exports = {};

/**
 * Policies for granting an access token based on password.
 *
 * @param req
 * @param callback
 */
exports.policies = function (req, callback) {
  var username = req.body.username;
  var password = req.body.password;

  async.waterfall ([
    /*
     * Lookup the account by username.
     */
    function (callback) {
      Account.findOne ({username: username}, callback);
    },

    /*
     * Verify the password is a match.
     */
    function (account, callback) {
      if (!account)
        return callback (new HttpError (400, 'invalid_username', 'Invalid username'));

      if (!account.enabled)
        return callback (null, false, 'Account is disabled');

      async.waterfall ([
        function (callback) {
          account.verifyPassword (password, callback);
        },

        function (match, callback) {
          if (!match)
            return callback (new HttpError (400, 'invalid_password', 'Incorrect password'));

          req.account = account;

          return callback (null, true);
        }
      ], callback);
    }
  ], callback);
};

/**
 * Create an access token.
 *
 * @param req
 * @param callback
 */
exports.createToken = function (req, callback) {
  var doc = {
    client: req.client._id,
    account: req.account._id,
    scope: _.union (req.client.scope, req.account.scope),
    refresh_token: new ObjectId ()
  };

  UserToken.create (doc, callback);
};
