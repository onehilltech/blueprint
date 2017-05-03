'use strict';

const async     = require ('async')
  , http        = require ('http')
  , debug       = require ('debug') ('blueprint:policy')
  , util        = require ('util')
  , _           = require ('underscore')
  , handleError = require ('./handleError')
  , Framework   = require ('./Framework')
  , Error       = require ('./errors/BlueprintError')
  , HttpError   = require ('./errors/HttpError')
  ;

/**
 * @class PolicyError
 */
function PolicyError () {
  this._errors = [];
}

PolicyError.prototype.hasErrors = function () {
  return this._errors.length !== 0;
};

PolicyError.prototype.push = function (error) {
  if (_.isString (error))
    error = {reason: 'policy_failed', message: error};

  this._errors.push (error);
};

PolicyError.prototype.getFirstHttpError = function () {
  var firstError = this._errors[0];
  return new HttpError (403, firstError.reason, firstError.message)
};

Object.defineProperty (http.IncomingMessage.prototype, 'hasPolicyErrors', {
  get: function () {
    return this._policyError.hasErrors ();
  }
});

Object.defineProperty (http.IncomingMessage.prototype, 'policyError', {
  get: function () {
    return this._policyError;
  }
});

var exports = module.exports = {};

/**
 * The optional policy is always true.
 */
function __blueprint_optionalPolicy (req, callback) {
  return callback (null, true);
}

function lookupPolicyByName (app, name) {
  // Resolve the policy by its name. If the policy starts with a question mark
  // (?), then this is an optional policy. Meaning, we do not fail if we cannot
  // find it.
  var parts = name.split (':');
  var policyManager;
  var policyName;

  if (parts.length === 1) {
    policyManager = app.policyManager;
    policyName = parts[0];
  }
  else {
    policyManager = app.modules[parts[0]];
    policyName = parts[1];
  }

  var optional = policyName[0] === '?';

  if (optional)
   policyName = policyName.slice (1);

  var policy = policyManager.find (policyName);

  if (!policy && optional)
    policy = __blueprint_optionalPolicy;

  return policy;
}

/**
 * Callback function for the policies. It allows us to capture the reason
 * for the failure, and attach it to the originating request.
 */
function policyCallback (req, callback) {
  return function (err, result, reason) {
    if (result === false && reason)
      req._policyError.push (reason);

    return callback (err, result);
  }
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
    policy = lookupPolicyByName (Framework.app, policy);

    if (!policy)
      throw new Error ('invalid_policy', util.format ('Policy %s does not exist', policyName), {policy: policyName});
  }

  policy.apply (null, args);
}

exports.evaluate = evaluate;

/**
 * Delay load a Policy.
 */
function load (opts) {
  return new Promise (function (resolve, reject) {
    // If the argument is function, then we are resolved.
    if (_.isFunction (opts))
      return resolve (opts);

    var app = Framework.app;

    if (app.isInit) {
      // The application is already initialized. This means we can
      // perform a lookup for the policy.
      lookup (app, opts);
    }
    else {
      // We need to wait until the application has been initialized to
      // perform the lookup of the policy. Otherwise, it will not be
      // present in the application.
      Framework.messaging.once ('app.init', function (app) {
        lookup (app, opts);
      });
    }

    function lookup (app, policyName) {
      var policy = lookupPolicyByName (app, policyName);
      
      if (policy)
        return resolve (policy);
      else
        return reject (new Error ('invalid_policy', util.format ('Policy %s does not exist', opts), {name: policyName}));
    }
  });
}

exports.load = load;

/**
 * Factory method for creating a policy that can be evaluated. This factory
 * return a function that has the signature function (req, callback). The
 * callback (err, result) return true if the policy is passed, or false if
 * the policy failed.
 */
function checkPolicy () {
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
        policyArgs.push (policyCallback (req, callback));

        // Call the check.
        policy.apply (null, policyArgs);
      },
      function (err) {
        debug (util.inspect (err));
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
      policies.push (checkPolicy (policy));
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
      return policy (req, policyCallback (req, callback));
    }, callback);
  }
}

function anySeries (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.someSeries (policies, function (policy, callback) {
      return policy (req, policyCallback (req, callback));
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
      return policy (req, policyCallback (req, callback));
    }, callback);
  }
}

function allSeries (list) {
  var policies = makePolicyList (list);

  return function (req, callback) {
    async.everySeries (policies, function (policy, callback) {
      return policy (req, policyCallback (req, callback));
    }, callback);
  }
}

/**
 * Make a middleware function for the policy.
 *
 * @param policy      Policy to validate
 */
function middleware (policy) {
  var promise = load (policy);

  return function __blueprint_policy (req, res, next) {
    // Initialize the policy for the request.
    initialize (req);

    promise.then (
      function (policy) {
        try {
          policy (req, policyCallback (req, function (err, result) {
            // The fast path.
            if (!err && result)
              return next ();

            // We accept the error.
            if (err)
              return handleError (err, res);

            // The policy failed. We need to determine the kind of response to send
            // back to the client. Do we send the default http error, or do we send
            // an more concrete http error.
            if (req.hasPolicyErrors)
              return handleError (req.policyError.getFirstHttpError (), res);

            return handleError (new HttpError (403, 'unknown_error', 'Unknown error has occurred'), res);
          }));
        }
        catch (ex) {
          return handleError (ex, res);
        }
      },
      function (err) {
        return handleError (err, res);
      }
    );
  };
}

function initialize (req) {
  if (!req._policyError)
    req._policyError = new PolicyError ();
}

exports.middleware = middleware;
exports.check = exports.assert = checkPolicy;
exports.not = not;
exports.any = any;
exports.anySeries = anySeries;

exports.all = all;
exports.allSeries = allSeries;

exports.initialize = initialize;

exports.callback = policyCallback;
