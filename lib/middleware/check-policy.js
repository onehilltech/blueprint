const HttpError = require ('../http-error');

const {
  isObjectLike,
} = require ('lodash');

/**
 * Factory method for creating a policy middleware for a request.
 *
 * @param policy          A Policy object
 * @param params          Optional parameters for the policy
 * @returns {Function}
 */
module.exports = function (policy) {
  return function __blueprint_check_policy (req, res, next) {
    let result = policy.runCheck (req);

    if ((result instanceof Promise))
      result.then (result => checked (result)).catch (next);
    else
      checked (result);

    function checked (result) {
      if (result === true)
        return next ();

      if (result === false) {
        // The policy result was a boolean value. This means that we are to use
        // the default failure code and message as the policy error.
        const {failureCode,failureMessage} = policy;
        return next (new HttpError (403, failureCode, failureMessage));
      }
      else if (isObjectLike (result)) {
        // The result is an object. This means we are to use the result
        // as-is for the policy error.
        const {failureCode, failureMessage} = result;
        return next (new HttpError (403, failureCode, failureMessage));
      }
      else {
        console.error (`Policy ${policy.name} returned a bad result.`);
        return next (new HttpError (500, 'bad_result', 'The policy returned a bad result.'));
      }
    }
  };
};
