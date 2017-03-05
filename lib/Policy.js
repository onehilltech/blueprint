var async       = require ('async')
  , util        = require ('util')
  , _           = require ('underscore')
  , Framework   = require ('./Framework')
  , Error       = require ('./errors/BlueprintError')
  , PolicyError = require ('./errors/PolicyError')
  ;

var exports = module.exports = {};

function lookupPolicyByName (name) {
  var policy = Framework ().app.policyManager.find (name);
  if (policy) return policy;
  throw new Error ('invalid_policy', 'Policy does not exist', {name: name});
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
  var args = [].slice.call (arguments);
  var policy = args.shift ();

  if (!_.isFunction (policy) && !_.isString (policy))
    throw new Error ('invalid_policy', 'Policy must be a Function or String');

  var name;

  if (_.isString (policy)) {
    name = policy;
    policy = lookupPolicyByName (policy);
  }
  else {
    name = policy.name;
  }

  return function __blueprint_check_policy (req, callback) {
    // Clone the arguments array for the policy, then add to request and callback
    // as the last arguments.
    var policyArgs = args.slice ();
    policyArgs.push (req);
    policyArgs.push (function (err, result) {
      if (err) return callback (new Error ('policy_error', 'Policy error', {name: name, reason: err}));
      if (!result) return callback (new Error ('policy_failed', 'Policy failed', {name: name}));
      return callback (null, true);
    });

    // Call the check.
    return policy.apply (null, policyArgs);
  };
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

/**
 * Accept if one of the policies pass.
 *
 * @param list          List of policies
 * @returns {Function}
 */
function any (list) {
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

  return function (req, callback) {
    async.some (policies, function (policy, callback) {
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

  return function (req, callback) {
    async.every (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

exports.check = exports.assert = policyWrapper;
exports.not = not;
exports.any = any;
exports.all = all;

