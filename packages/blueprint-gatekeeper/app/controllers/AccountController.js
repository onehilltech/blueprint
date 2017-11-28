'use strict';

let blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , ObjectId   = mongodb.Types.ObjectId
  , async      = require ('async')
  , objectPath = require ('object-path')
  , _          = require ('underscore')
  , Account    = require ('../models/Account')
  , password   = require ('../middleware/granters/password')
  , HttpError  = blueprint.errors.HttpError
  ;

let ResourceController = mongodb.ResourceController
  ;

/**
 * Default account id generator. This generator will just produce a new
 * ObjectId for each account.
 */
function __generateAccountId (account, callback) {
  callback (null, account._id || new ObjectId ());
}

let generateAccountId = objectPath.get (blueprint.app.configs.gatekeeper, 'generators.accountId', __generateAccountId);

/**
 * Sanitize the account id.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
function idSanitizer (req, callback) {
  if (req.params.accountId === 'me')
    req.params.accountId = req.user._id;
  else
    req.sanitizeParams ('accountId').toMongoId ();

  return callback (null);
}

/**
 * @class AccountController
 *
 * @constructor
 */
function AccountController () {
  ResourceController.call (this, {
    model: Account,
    namespace: 'gatekeeper',
    modelPath: 'created_by',
    idOptions: {
      validator: 'isMongoIdOrToken',
      validatorOptions: ['me'],
      sanitizer: idSanitizer
    }
  });
}

blueprint.controller (AccountController, ResourceController);

module.exports = AccountController;

/**
 * Specialize the creation of an account.
 */
AccountController.prototype.create = function () {
  let options = {
    on: {
      prepareDocument: function (req, doc, callback) {
        doc.created_by = req.user._id;

        async.waterfall ([
          function (callback) {
            generateAccountId (doc, callback);
          },

          function (id, callback) {
            if (id != null)
              doc._id = id;

            return callback (null, doc);
          }
        ], callback);
      },

      prepareResponse: function (req, result, callback) {
        if (!req.query.login)
          return callback (null, result);

        async.waterfall ([
          function (callback) {
            let data = {client: req.user, account: result.account};
            password.createToken (data, callback);
          },

          function (accessToken, callback) {
            accessToken.serialize (callback);
          },

          function (token, callback) {
            result.token = _.extend ({token_type: 'Bearer'}, token);
            return callback (null, result);
          }
        ], callback);
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Specialize the update of an account.
 */
AccountController.prototype.update = function () {
  return ResourceController.prototype.update.call (this, {
    on: {
      prepareUpdate: function (req, doc, callback) {
        // Make sure the update does not include properties that cannot be updated
        // and/or deleted.
        if (req.scope.indexOf ('gatekeeper.account.update') === -1 && req.scope.indexOf ('gatekeeper.account.*') === -1 && (doc.$set.scope || doc.$unset.scope))
          return callback (new HttpError (403, 'unauthorized', 'You are not authorized to update or delete the scope.'));

        if (doc.$set && doc.$set.password)
          return callback (new HttpError (400, 'bad_request', 'You cannot directly change the password.'));

        if (doc.$unset && doc.$unset.password)
          return callback (new HttpError (400, 'bad_request', 'You cannot delete the password.'));

        return callback (null, doc);
      }
    }
  });
};

/**
 * Change the password on the account.
 */
AccountController.prototype.changePassword = function () {
  return {
    validate: {
      'accountId': {
        in: 'params',
        isMongoIdOrToken: {
          errorMessage: "Must be ObjectId or 'me'",
          options: ['me']
        }
      },
      'password.current': {
        in: 'body',
        notEmpty: true
      },

      'password.new': {
        in: 'body',
        notEmpty: true
      }
    },

    sanitize: idSanitizer,

    execute: function (req, res, callback) {
      const currentPassword = req.body.password.current;
      const newPassword = req.body.password.new;

      async.waterfall ([
        function (callback) {
          Account.findById (req.params.accountId, callback);
        },

        function (account, callback) {
          async.waterfall ([
            function (callback) {
              account.verifyPassword (currentPassword, callback);
            },

            function (match, callback) {
              if (!match)
                return callback (new HttpError (400, 'invalid_password', 'Current password is invalid'));

              account.password = newPassword;
              account.save (callback);
            }
          ], callback);
        },

        function (account, n, callback) {
          res.status (200).json (n === 1);
          return callback (null);
        }
      ], callback);
    }
  }
};
