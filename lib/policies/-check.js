const CoreObject = require ('../object');
const {get} = require ('object-path');

module.exports = CoreObject.extend ({
  name: null,

  params: [],

  optional: false,

  resolvePolicyFrom (policies) {
    let Policy = get (policies, this.name);

    if (!Policy) {
      if (this.optional)
        return null;

      throw new Error (`We cannot locate the policy named ${this.name}.`);
    }

    let policy = new Policy ();
    policy.setParameters (...this.params);

    return policy;
  }
});
