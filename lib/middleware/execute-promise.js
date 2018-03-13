/**
 * Factory method for creating a middleware function for the execute
 * function that returns a Promise.
 *
 * @param execute         Execute method that returns a promise.
 * @returns {Function}
 */
module.exports = function (execute) {
  return function __blueprint_execute (req, res, next) {
    execute (req, res).then (() => next ()).catch (next);
  }
};
