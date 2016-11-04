var blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , gatekeeper = require ('../../lib')
  ;

var Client  = require ('../models/Client')
  ;

var ResourceController = mongodb.ResourceController
  , Policy = blueprint.Policy
  ;

function ClientController () {
  ResourceController.call (this, {name: 'client', model: Client, eventPrefix: 'gatekeeper'});
}

blueprint.controller (ClientController, ResourceController);

/**
 * Get all the accounts in the database. Only administrators can access all the accounts
 * in the database.
 */
ClientController.prototype.getAll = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.assert ('is_administrator')
        ).evaluate (req, callback);
      },

      prepareProjection: function (req, callback) {
        callback (null, DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE);
      }
    }
  };

  return ResourceController.prototype.getAll.call (this, options);
};

/**
 * Get a single client from the database.
 *
 * @returns {Function}
 */
ClientController.prototype.get = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.assert ('is_administrator')
        ).evaluate (req, callback);
      }
    }
  };

  return ResourceController.prototype.get.call (this, options);
};

/**
 * Create a new client in the database.
 *
 * @returns {*|Object}
 */
ClientController.prototype.create = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.assert ('is_administrator')
        ).evaluate (req, callback);
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Delete an client in the database
 *
 * @returns {*|Object}
 */
ClientController.prototype.delete = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.assert ('is_administrator')
        ).evaluate (req, callback);
      }
    }
  };

  return ResourceController.prototype.delete.call (this, options);
};

module.exports = ClientController;
