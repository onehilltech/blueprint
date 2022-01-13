/**
 * Factory method for creating a middleware function for the execute
 * function that returns a Promise.
 *
 * @param action         Action to execute
 * @returns {Function}
 */
module.exports = function (action) {
  return async function __blueprint_execute_action (req, res, next) {
    try {
      await action.execute (req, res);
      next ();
    }
    catch (err) {
      next (err);
    }
  }
};
