'use strict';

const Error = require ('./BlueprintError')
  , util    = require ('util')
  ;

module.exports = PolicyError;

/**
 * @class PolicyError
 *
 * Base class for all http errors.
 *
 * @param name      Name of the failed policy
 * @constructor
 */
function PolicyError (name) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.call (this, 'policy_failed', 'Policy failed', {name: name});
}

util.inherits (PolicyError, Error);

PolicyError.prototype.accept = function (v) {
  v.visitPolicyError (this);
};
