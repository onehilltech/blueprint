const Object = require ('./object');
const HttpError = require ('./http-error');

/**
 * @class Policy
 *
 * Base class for all policies. All policies must override the runCheck()
 * method, which is used to evaluate the policy.
 */
const Policy = Object.extend ({
  /// The default code for a policy failure.
  failureCode: 'policy_failed',

  /// The default message for a policy failure.
  failureMessage: 'The request did not satisfy a required policy.',

  /**
   * Run the policy check. This method can be evaluated either synchronously or
   * asynchronously. If you are evaluating the policy synchronously, then you must
   * return a boolean value. True if the policy passes, or false if the policy fails.
   *
   * If you are evaluating the policy asynchronously, then you must return a Promise.
   * The promise must settle with a boolean value.
   *
   * If there is an error, then you can throw an exception, or settle a promise by
   * rejecting it with an exception. The latter is the preferred approach.
   *
   * @params req                  Incoming request
   * @return {Boolean|Promise}    Policy evaluation
   */
  runCheck: null
});

module.exports = Policy;

Policy.middleware = function (policy, args) {
  return function __blueprint_policy (req, res, next) {
    policy.runCheck (req, ...args).then (result => {
      if (result)
        return next (null);

      let {failureCode,failureMessage} = policy;

      return next (new HttpError (403, failureCode, failureMessage))
    })
  };
};
