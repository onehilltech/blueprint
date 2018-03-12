const HttpError = require ('../http-error');

const {
  isObjectLike
} = require ('lodash');

/**
 * Factory method for creating a policy middleware for a request.
 *
 * @param name            Name of policy for reporting
 * @param policy          A Policy object
 * @param params          Optional parameters for the policy
 * @returns {Function}
 */
module.exports = function (name, policy, params = []) {
  return function __blueprint_policy (req, res, next) {
    // Initialize an empty policy errors container for the request. This
    // is needed for legacy purposes.

    if (!req._policyErrors || !isArray (req._policyErrors))
      req._policyErrors = [];

    policy.runCheck (req, ...params).then (result => {
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
        console.error (`The policy ${name} returned a bad result`);
        return next (new HttpError (500, 'bad_result', 'The policy returned a bad result.'));
      }
    }).catch (next);
  };
};
