var async     = require ('async')
  , util      = require ('util')
  , _         = require ('underscore')
  , Framework = require ('./Framework')
  ;

var HttpError = require ('./errors/HttpError')
  ;

/**
 * Definition of a policy.
 *
 * @param def
 * @constructor
 */
function PolicyDefinition (def) {
  this._def = def;
}

/**
 * Evaluate the policy definition. If the policy evaluation fails, then 403 is
 * returned to the client.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
PolicyDefinition.prototype.evaluate = function (req, callback) {
  function complete (err, result) {
    if (err) return callback (err);
    if (!result) return callback (new HttpError (403, 'policy_failed', 'Policy failed'));
    return callback (null);
  }

  return this._def (req, complete);
};

function PolicyDefinitionFactory (def) {
  return new PolicyDefinition (def);
}

module.exports = exports = PolicyDefinitionFactory;

exports.Definition = PolicyDefinitionFactory;

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
    var name = policy;
    policy = Framework ().app.policyManager.find (policy);

    if (!policy)
      throw new Error (util.format ('Policy %s does not exist', name));
  }

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
    throw new Error ('Policy must be a Function or String');

  if (_.isString (policy)) {
    var name = policy;
    policy = Framework ().app.policyManager.find (name);

    if (!policy)
      throw new Error (util.format ('Policy %s does not exist', name));
  }

  return function __blueprint_policy (req, callback) {
    // Clone the arguments array for the policy, then add to request and callback
    // as the last arguments.
    var policyArgs = args.slice ();
    policyArgs.push (req);
    policyArgs.push (callback);

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
    policies.push (policyWrapper (policy));
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
    policies.push (policyWrapper (policy));
  });

  return function (req, callback) {
    async.every (policies, function (policy, callback) {
      return policy (req, callback);
    }, callback);
  }
}

exports.assert = policyWrapper;
exports.not = not;
exports.any = any;
exports.all = all;

