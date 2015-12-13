'use strict';

/**
 * @class BaseController
 * @constructor
 *
 * Base class for all controllers.
 */
function BaseController () {

}

BaseController.prototype.notifyCallback = function () {
  // Remove the first parameter from the argument list. This solution is adapted from
  // the following StackOverflow solution:
  //
  //  http://stackoverflow.com/a/13296688/2245732
  var shift = [].shift;
  var callback = shift.apply (arguments);
  var args = arguments;

  process.nextTick (function () {
    callback.apply (callback, args);
  });
};

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

BaseController.prototype.uploadSingle = function (name, next) {
  return [
    multer.single (name),
    next
  ];
};

BaseController.prototype.uploadArray = function (name, maxCount, next) {
  return [
    multer.array (name, maxCount),
    next
  ];
};

module.exports = exports = BaseController;
