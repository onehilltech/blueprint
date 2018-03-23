const CoreObject = require ('../object');
const {get} = require ('object-path');

module.exports = CoreObject.extend ({
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
