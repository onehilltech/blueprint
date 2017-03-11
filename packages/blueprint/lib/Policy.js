var async     = require ('async')
  , winston   = require ('winston')
  , util      = require ('util')
  , _         = require ('underscore')
  , Framework = require ('./Framework')
  , Error     = require ('./errors/BlueprintError')
  ;

var exports = module.exports = {};

function lookupPolicyByName (name) {
  return Framework ().app.policyManager.find (name);
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

  if (_.isString (policy)) {
    var policyName = policy;
    policy = lookupPolicyByName (policy);

    if (!policy)
      throw new Error ('invalid_policy', util.format ('Policy %s does not exist', policyName), {policy: policyName});
  }

  policy.apply (null, args);
}

exports.evaluate = evaluate;

/**
 * The optional policy is always true.
 */
function __blueprint_optionalPolicy (req, callback) {
  return callback (null, true);
}

/**
 * Delay load a Policy.
 */
function load (opts) {
  return new Promise (function (resolve, reject) {
    // If the argument is function, then we are resolved.
    if (_.isFunction (opts))
      return resolve (opts);

    // Resolve the policy by its name. If the policy starts with a question mark
    // (?), then this is an optional policy. Meaning, we do not fail if we cannot
    // find it.
    var optional = opts[0] == '?';
    var policyName = optional ? opts.slice (1) : opts;
    var policy = lookupPolicyByName (policyName);

    if (!policy && optional)
      policy = __blueprint_optionalPolicy;

    if (policy)
      return resolve (policy);
    else
      return reject (new Error ('invalid_policy', util.format ('Policy %s does not exist', opts), {name: opts}));
  });
}

exports.load = load;

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
  // in the application if loaded from a module. We can use a Promise to handle
  // this concern.

  var promise = load (firstArg);

  return function __blueprint_checkPolicy (req, callback) {
    promise.then (
      function (policy) {
        // Clone the arguments array for the policy, then add to request and callback
        // as the last arguments.
        var policyArgs = args.slice ();
        policyArgs.push (req);
        policyArgs.push (callback);

        // Call the check.
        policy.apply (null, policyArgs);
      },
      function (err) {
        winston.log ('error', util.inspect (err));
      });
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
    async.everySeries (policies, function (policy, callback) {
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
