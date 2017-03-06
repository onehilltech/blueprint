'use strict';

var blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , messaging  = blueprint.messaging
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , gatekeeper = require ('../../lib')
  , Account    = require ('../models/Account')
  ;

var ResourceController = mongodb.ResourceController
  ;

var gatekeeperConfig;
var tokenStrategy;

var activationConfig;

messaging.on ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  activationConfig = gatekeeperConfig.activation || {};

  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

function AccountController () {
  ResourceController.call (this, {model: Account, eventPrefix: 'gatekeeper'});
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
          created_by : req.user._id
        };

        return callback (null, doc);
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
        if (doc.$set.scope && req.authInfo.scope.indexOf (gatekeeper.scope.superuser) === -1)
          delete doc.$set.scope;

        return callback (null, doc);
      }
    }
  };

  return ResourceController.prototype.update.call (this, options);
};

module.exports = AccountController;
