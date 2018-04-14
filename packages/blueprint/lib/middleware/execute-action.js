/**
 * Factory method for creating a middleware function for the execute
 * function that returns a Promise.
 *
 * @param action         Action to execute
 * @returns {Function}
 */
module.exports = function (action) {
  return function __blueprint_execute_action (req, res, next) {
    try {
      Promise.resolve (action.execute (req, res))
        .then (() => next ())
        .catch (next);
    }
    catch (ex) {
      next (ex);
    }
  }
};
