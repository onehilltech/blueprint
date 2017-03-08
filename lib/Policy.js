var async       = require ('async')
  , util        = require ('util')
  , _           = require ('underscore')
  , Framework   = require ('./Framework')
  , Error       = require ('./errors/BlueprintError')
  ;

var exports = module.exports = {};

function lookupPolicyByName (name) {
  var policy = Framework ().app.policyManager.find (name);

  if (policy)
    return policy;

  throw new Error ('invalid_policy', util.format ('Policy %s does not exist', name), {name: name});
}

/**
 * Evaluate a policy. The first parameter can either be a policy function,
 * or the name of a policy. In the latter case, the policy function is resolved
 * using the existing policies loaded by the appliction.
 */
function evaluate () {
  // Pop the first argument.
  var args = [].slice.call (arguments);
  var policy = args.shift ();

  if (_.isString (policy))
    policy = lookupPolicyByName (policy);

  policy.apply (null, args);
}

exports.evaluate = evaluate;

/**
 * Factory method for creating a policy that can be evaluated. This factory
 * return a function that has the signature function (req, callback). The
 * callback (err, result) return true if the policy is passed, or false if
 * the policy failed.
 *
 * @constructor
 */
function policyWrapper () {
  // The first argument for this function must be the policy. It can either
  // be a string name or a function.
  var args = [].slice.call (arguments);
  var firstArg = args.shift ();

  if (!_.isFunction (firstArg) && !_.isString (firstArg))
    throw new Error ('invalid_policy', 'Policy must be a Function or String');

  // If the first argument is a string, then we need to lazy load the policy
  // the first time it is evaluated. Otherwise, the policy may not be available
  // in the application if loaded from a module. To reduce the excessive if
  // checks, we implement the state pattern. We can either be in the resolve
  // state or the check state. Once in the check state, we always remain in
  // the check state.

  var currentState;

  if (_.isString (firstArg)) {
    currentState = __blueprint_resolve (firstArg);
  }
  else {
    currentState = __blueprint_policy (firstArg);
  }

  return function __blueprint_checkPolicy (req, callback) {
    currentState = currentState.call (null, req, callback);
  };

  /**
   * Resolve state for the wrapper. In this state, we must lookup the policy by
   * its name in the current application. Once the policy is resolved, we can
   * can invoke it and remember it for next time.
   *
   * @param policyName        Name of policy to resolve
   */
  function __blueprint_resolve (policyName) {
    return function __blueprint_resolvePolicy (req, callback) {
      var policy = lookupPolicyByName (policyName);

      if (!policy)
        return callback (new Error ('invalid_policy', util.format ('Policy does not exist'), {name: policyName}));

      // Check the policy this one time, and then switch states.
      var check = __blueprint_policy (policy);
      return check.call (null, req, callback);
    }
  }

  /**
   * Wrapper for a resolved policy.
   *
   * @param policy              Policy function
   * @private
   */
  function __blueprint_policy (policy) {
    return function __blueprint_policyCheck (req, callback) {
      // Clone the arguments array for the policy, then add to request and callback
      // as the last arguments.
      var policyArgs = args.slice ();
      policyArgs.push (req);
      policyArgs.push (callback);

      // Call the check.
      policy.apply (null, policyArgs);

      // Stay in the same state.
      return __blueprint_policyCheck;
    }
  }
 }

/**
 * Negate a policy.
 *
 * @param policy
 * @returns {function(req, callback)}
 */
function not (policy) {
  return function __blueprint_not_policy (req, callback) {
    return policy (req, function __blueprint_not_result (err, result) {
      return callback (err, !result);
    });
  };
}

function makePolicyList (list) {
  var policies = [];

  list.forEach (function (policy) {
    if (_.isFunction (policy)) {
      policies.push (policy);
    }
    else if (_.isString (policy)) {
      policies.push (policyWrapper (policy));
    }
    else {
      throw new Error ('invalid_policy', 'Policy must be a String or Function');
    }
  });

  return policies;
}

/**
 * Accept if one of the policies pass.
 *
 * @param list          List of policies
 * @returns {Function}
 */
function any (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.some (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

function anySeries (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.someSeries (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

/**
 * Accept if all of the policies pass.
 *
 * @param list          List of policies
 * @returns {Function}
 */
function all (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.every (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

function allSeries (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.every (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

exports.check = exports.assert = policyWrapper;
exports.not = not;
exports.any = any;
exports.anySeries = anySeries;

exports.all = all;
exports.allSeries = allSeries;
