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
      let p = action.execute (req, res);

      if (p)
        p.then (() => next ()).catch (next);
      else
        next ();
    }
    catch (ex) {
      next (ex);
    }
  }
};
