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

BaseController.prototype.handleError = function (err, res, status, message, callback) {
  if (res)
    res.status (status).send (message);

  if (callback)
    this.notifyCallback (err ? err : new Error (message));
};
