'use strict';

var blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , async      = require ('async')
  , objectPath = require ('object-path')
  , Account    = require ('../models/Account')
  ;

var ResourceController = mongodb.ResourceController
  ;

const gatekeeperConfig = blueprint.app.configs.gatekeeper
  ;

/**
 * Default account id generator. This generator will just produce a new
 * ObjectId for each account.
 */
function __generateAccountId (account, callback) {
  callback (null, new mongodb.Types.ObjectId ());
}

var generateAccountId = objectPath.get (gatekeeperConfig, 'generators.accountId', __generateAccountId);

function AccountController () {
  ResourceController.call (this, {model: Account, namespace: 'gatekeeper'});
}

blueprint.controller (AccountController, ResourceController);

/**
 * Create a new account.
 *
 * @returns {*}
 */
AccountController.prototype.create = function () {
  var options = {
    on: {
      prepareDocument: function (req, doc, callback) {
        doc = {
          email : req.body.account.email,
          username : req.body.account.username,
          password : req.body.account.password,
          created_by : req.user.id
        };

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
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Delete an account in the database
 */
AccountController.prototype.update = function () {
  var options = {
    on: {
      /**
       * Prepare the update document. Depending on the scope of the request, certain
       * fields can and cannot be updated.
       *
       * @param req
       * @param doc
       * @param callback
       * @returns {*}
       */
      prepareUpdate: function (req, doc, callback) {
        // This is permanent field that can never be updated.
        if (doc.$set.created_by)
          delete doc.$set.created_by;

        // Only the superuser can update the scope.
        if (!req.superuser)
          delete doc.$set.scope;

        return callback (null, doc);
      }
    }
  };

  return ResourceController.prototype.update.call (this, options);
};

module.exports = AccountController;
