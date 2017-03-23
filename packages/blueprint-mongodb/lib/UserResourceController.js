const util     = require ('util')
  , objectPath = require ('object-path')
  ;

var ResourceController = require ('./ResourceController')
  ;

/**
 * @class UserResourceController
 *
 * Resource controller that assigns the user making the request as the
 * owner of the resource.
 */
function UserResourceController (opts) {
  ResourceController.call (this, opts);

  this._userPath = opts.userPath || 'user';
  this._modelPath = opts.modelPath || 'user';
}

util.inherits (UserResourceController, ResourceController);

module.exports = UserResourceController;

function __prepareDocument (req, doc, callback) { return callback (null, doc); }

/**
 * Create a new resource.
 */
UserResourceController.prototype.create = function (opts) {
  var prepareDocument = opts.prepareDocument || __prepareDocument;
  var _this = this;

  return ResourceController.prototype.create.call (this, {
    on: {
      prepareDocument: function (req, doc, callback) {
        // Get the user id from the request, and set the user id on the model path.
        var userId = objectPath.get (req, _this._userPath);
        objectPath.set (doc, _this._modelPath, userId);

        // Pass control to the subclass.
        return prepareDocument (req, doc, callback);
      }
    }
  });
};
