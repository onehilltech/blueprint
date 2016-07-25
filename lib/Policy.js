var async = require ('async')
  , util = require ('util')
  ;

var Framework = require ('./Framework')
  , HttpError = require ('./errors/HttpError')
  ;

var app = require ('./index').app;

/**
 * Create a policy evaluator that can be used to validate a request.
 *
 * @param policy  Policy function with signature (req, callback).
 * @returns {__blueprint_policy}
 */
function PolicyFactory (policy) {
  return function __blueprint_policy (req, callback) {
    return policy (req, function (err, result) {
      if (!result) return callback (new HttpError (403, 'Unauthorized access'));
      return callback ();
    })
  }
}

exports = module.exports = PolicyFactory;

/**
 * Factory method for creating a policy that can be evaluated. This factory
 * return a function that has the signature function (req, callback). The
 * callback (err, result) return true if the policy is passed, or false if
 * the policy failed.
 *
 * @constructor
 */
function PolicyRule () {
  var args = [].slice.call (arguments);
  var func = args.shift ();

  if (typeof func === 'string') {
    func = Framework ().app._policyManager.find (func);

    if (!func)
      throw new Error (util.format ('Policy %s does not exist', func));
  }

  return function __blueprint_policy (req, callback) {
    // Push the callback as the last argument.
    args.push (req);
    args.push (callback);

    // Call the check.
    return func.apply (null, args);
  };
}

/**
 * Collection of policies where at least one must pass.
 *
 * @param policies
 * @returns {__blueprint_or_policy}
 * @constructor
 */
function orPolicy (policies) {
  return function __blueprint_or_policy (req, callback) {
    async.some (policies,
      function __blueprint_or_iterator (policy, callback) {
        return policy (req, function __blueprint_or_result (err, result) {
          // Since we are using async 1.5, we need to ignore the err parameter.
          callback (result);
        });
      },
      function __blueprint_or_complete (result) {
        // This is a callback from our framework. We need to pass in null as
        // the error so we have proper behavior.
        return callback (null, result);
      }
    );
  };
}

/**
 * Collection of policies where all must pass.
 *
 * @param policies
 * @returns {__blueprint_and_policy}
 */
function andPolicy (policies) {
  return function __blueprint_and_policy (req, callback) {
    async.every (policies,
      function __blueprint_and_iterator (policy, callback) {
        return policy (req, function __blueprint_and_result (err, result) {
          // Since we are using async 1.5, we need to ignore the err parameter.
          callback (result);
        });
      },
      function __blueprint_and_complete (result) {
        // This is a callback from our framework. We need to pass in null as
        // the error so we have proper behavior.
        return callback (null, result);
      }
    );
  };
}

/**
 * Negate a policy.
 *
 * @param policy
 * @returns {__blueprint_not_policy}
 */
function notPolicy (policy) {
  return function __blueprint_not_policy (req, callback) {
    return policy (req, function __blueprint_not_result (err, result) {
      return callback (err, !result);
    });
  };
}

exports.assert = PolicyRule;
exports.and = andPolicy;
exports.not = notPolicy;
exports.or = orPolicy;
