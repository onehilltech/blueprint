/**
 * Factory method for creating a middleware function for the execute
 * function that returns a Promise.
 *
 * @param execute         Execute method that returns a promise.
 * @returns {Function}
 */
module.exports = function (execute) {
  return function __blueprint_execute (req, res, next) {
    try {
      let p = execute (req, res);

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
