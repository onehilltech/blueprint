const async     = require ('async');
const blueprint = require ('@onehilltech/blueprint');
const mongodb   = require ('@onehilltech/blueprint-mongodb');
const ObjectId  = mongodb.Types.ObjectId;
const HttpError = blueprint.errors.HttpError;
const Account   = require ('../../models/Account');
const UserToken = require ('../../models/UserToken');
const {union}   = require ('lodash');

/**
 * Policies for granting an access token based on password.
 *
 * @param req
 * @param callback
 */
function policies (req, callback) {
  const {username,password} = req.body;

  async.waterfall ([
    /*
     * Lookup the account by username.
     */
    function (callback) {
      Account.findOne ({username}, callback);
    },

    /*
     * Verify the password is a match.
     */
    function (account, callback) {
      if (!account)
        return callback (new HttpError (400, 'invalid_username', 'The username does not exist.'));

      if (!account.enabled)
        return callback (null, false, 'The account is disabled.');

      async.waterfall ([
        function (callback) {
          account.verifyPassword (password, callback);
        },

        function (match, callback) {
          if (!match)
            return callback (new HttpError (400, 'invalid_password', 'The password for the account is incorrect.'));

          req.account = account;

          return callback (null, true);
        }
      ], callback);
    }
  ], callback);
}

/**
 * Create an access token.
 */
function createToken (req, callback) {
  const {account,client} = req;
  const origin = req.get ('origin');

  const doc = {
    client : client._id,
    account: account._id,
    scope  : union (client.scope, account.scope),
    refresh_token: new ObjectId (),
    origin,
  };

  UserToken.create (doc, callback);
}

module.exports = {
  createToken,
  policies
};
