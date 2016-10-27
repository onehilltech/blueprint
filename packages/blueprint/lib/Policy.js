var async = require ('async')
  , util = require ('util')
  , _ = require ('underscore')
  , Framework = require ('./Framework')
  ;

var HttpError = require ('./errors/HttpError')
  ;

// The module needs to store the initialize application. We are not going
// to rely on the getting the app directly from the framework since there
// is good chance it may not be initialized.
var app;

Framework ().messaging.on ('app.init', function (result) {
  app = result;
});

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
 * Evaluate the policy definition.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
PolicyDefinition.prototype.evaluate = function (req, callback) {
  return this._def (req, function (err, result) {
    if (!result) return callback (new HttpError (403, 'Unauthorized access'));
    return callback ();
  });
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
    policy = app.policyManager.find (policy);

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
function PolicyRule () {
  var args = [].slice.call (arguments);
  var policy = args.shift ();

  if (_.isString (policy)) {
    var name = policy;
    policy = app.policyManager.find (policy);

    if (!policy)
      throw new Error (util.format ('Policy %s does not exist', name));
  }

  return function __blueprint_policy (req, callback) {
    // Push the callback as the last argument.
    args.push (req);
    args.push (callback);

    // Call the check.
    return policy.apply (null, args);
  };
}

/**
 * Collection of policies where at least one must pass.
 *
 * @param policies
 * @returns {function(req, callback)}
 * @constructor
 */
function orPolicy (policies) {
  return function __blueprint_or_policy (req, callback) {
    async.some (policies,
      function __blueprint_or_iterator (policy, callback) {
        return policy (req, callback);
      },
      callback);
  };
}

/**
 * Collection of policies where all must pass.
 *
 * @param policies
 * @returns {function(req, callback)}
 */
function andPolicy (policies) {
  return function __blueprint_and_policy (req, callback) {
    async.every (policies,
      function __blueprint_and_iterator (policy, callback) {
        return policy (req, callback);
      },
      callback);
  };
}

/**
 * Negate a policy.
 *
 * @param policy
 * @returns {function(req, callback)}
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
