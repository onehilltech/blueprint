/**
 * Factory method for creating the legacy sanitize middleware function.
 *
 * @param sanitize        Sanitize function
 * @returns {Function}
 */
module.exports = function sanitizer (sanitize) {
  return function __blueprint_sanitize (req, res, next) {
    sanitize (req, next);
  }
}
