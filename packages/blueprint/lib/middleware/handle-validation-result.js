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

  return next (new HttpError (400, 'validation_failed', 'The request validation failed.', {validation: errors.mapped ()}));
};
