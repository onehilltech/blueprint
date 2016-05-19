'use strict';

/**
 * @class BaseController
 * @constructor
 *
 * Base class for all controllers.
 */
function BaseController () {

}

BaseController.prototype.handleError = function (err, res, status, msg, cb) {
  if (res) {
    if (msg)
      res.status (status).send (msg);
    else
      res.sendStatus (status);
  }

  if (cb)
    this.notifyCallback (err ? err : new Error (msg));
};

BaseController.prototype.notFound = function () {
  return function (req, res) {
    res.status (404).json ({error: 'Not Found'});
  };
};

module.exports = exports = BaseController;
