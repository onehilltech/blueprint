'use strict';

const util     = require ('util')
  , objectPath = require ('object-path')
;

let ResourceController = require ('./ResourceController')
;

/**
 * @class UserResourceController
 *
 * Resource controller that assigns the user making the request as the
 * owner of the resource.
 */
function UserResourceController (opts) {
  ResourceController.call (this, opts);

  this.userPath = opts.userPath || 'user';
  this.userPathIsModel = opts.userPathIsModel !== undefined ? opts.userPathIsModel : true;

  if (this.userPathIsModel) {
    this.modelIdPath = opts.modelIdPath || '_id';
  }

  this.modelPath = opts.modelPath || 'user';
  this.allowAllAccess = !!opts.allowAllAccess;
}

util.inherits (UserResourceController, ResourceController);

module.exports = UserResourceController;

function __prepareDocument (req, doc, callback) { return callback (null, doc); }
function __prepareFilter (req, filter, callback) { return callback (null, filter); }

/**
 * Create a new resource.
 */
UserResourceController.prototype.create = function (opts) {
  let on = opts.on || {};
  let prepareDocument = on.prepareDocument || __prepareDocument;
  let controller = this;

  on.prepareDocument = function (req, doc, callback) {
    // Get the user id from the request, and set the user id on the model path.
    let user = objectPath.get (req, controller.userPath);
    objectPath.set (doc, controller.modelPath, user);

    // Pass control to the subclass.
    return prepareDocument (req, doc, callback);
  };

  opts.on = on;

  return ResourceController.prototype.create.call (this, opts);
};

/**
 * Create a new resource.
 */
UserResourceController.prototype.getAll = function (opts) {
  let on = opts.on || {};
  let prepareFilter = on.prepareFilter || __prepareFilter;
  let controller = this;

  on.prepareFilter = function (req, filter, callback) {
    if (!controller.allowAllAccess) {
      // The user resource can only be access by the person that created it. Let's
      // update the filter to prevent users who do not own the resource from access
      // the resource.
      let userId = objectPath.get (req, controller.userPath);

      if (controller.userPathIsModel) {
        userId = userId[controller.modelIdPath];
      }

      filter.$or = [
        {user: {$exists: false}}
      ];

      if (!filter._public) {
        filter.$or.push ({user: {$eq: userId}});
      }
      else {
        delete filter._public;
      }
    }

    // Pass control to the subclass.
    return prepareFilter (req, filter, callback);
  };

  opts.on = on;

  return ResourceController.prototype.getAll.call (this, opts);
};
