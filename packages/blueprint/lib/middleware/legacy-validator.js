/**
 * Factory method for creating the validate middleware function.
 *
 * @param validate        Validate function
 * @returns {Function}
 */
module.exports = function validator (validate) {
  return function __blueprint_validate (req, res, next) {
    validate (req, next);
  }
};
