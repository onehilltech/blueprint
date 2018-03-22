const CoreObject = require ('../object');
const {get} = require ('object-path');

const Check = CoreObject.extend ({
  name: null,

  params: [],

  optional: false,

  resolvePolicyFrom (policies) {
    let policyFactory = get (policies, this.name);

    if (!policyFactory) {
      if (this.optional)
        return null;

      throw new Error (`We cannot locate the policy named ${this.name}.`);
    }

    return policyFactory (...this.params);
  }
});


/**
 * The check policy builder will lookup an existing policy by name. The first
 * parameter to the check() method is the name of the policy. All remaining parameters
 * are passed to the policy factory method. If the policy is not found, then an
 * exception is thrown.
 *
 * If the name of the policy starts with a question mark (?), then the policy
 * is considered optional.
 *
 * @returns {*}
 */
module.exports = function () {
  const [name, ...params] = arguments;
  const optional = name[0] === '?';
  const policyName = optional ? name.slice (1) : name;

  return new Check ({ name: policyName, params, optional });
};