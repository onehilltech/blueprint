/**
 * Factory method that generates a middleware function for rendering a static
 * view to a request.
 *
 * @param view
 * @returns {Function}
 */
module.exports = function render (view) {
  return function __blueprint_render (req, res, next) {
    res.render (view);
    next ();
  };
};
