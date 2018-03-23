const HttpError = require ('../http-error');

const {
  validationResult
} = require ('express-validator/check');

/**
 * Handle the validation results.
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports = function (req, res, next) {
  const errors = validationResult (req);

  if (errors.isEmpty ())
    return next ();

  let err = new HttpError (400, 'validation_failed', 'Request validation failed.', {validation: errors.mapped ()});
  return next (err);
};
