const Check  = require ('./-check');
const Policy = require ('../policy');

const {
  isObjectLike
} = require ('lodash');

/**
 * @class AnyPolicy
 *
 * The composite policy that succeeds if any policy succeeds, or fails all
 * policies fail.
 */
const AnyPolicy = Policy.extend ({
  policies: [],

  runCheck (req) {
    // Run the checks on each of the policies.  We need to keep track of the
    // policies, and then make sure we resolve them all.
    let pending = [];

    this.policies.forEach (p => pending.push (p.runCheck (req)));

    return Promise.all (pending).then (results => {
      // We need to iterate over all the results. We can stop as soon as we find
      // the first result that fails since all results must pass for the all()
      // policy to succeed.
      for (let i = 0, len = results.length; i < len; ++ i)
      {
        if (results[i] === true)
          return true;
      }

      return false;
    });
  }
});

/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * @param       checks        Array of checks
 */
module.exports = (checks) => {
  return new Check ({
    name: 'any',

    resolvePolicyFrom (policies) {
      // We need to covert each of the checks into a policy. We only include
      // in the final set the list of policies that actually exist.
      let resolved = [];

      checks.forEach (check => {
        let policy = check.resolvePolicyFrom (policies);

        if (policy != null)
          resolved.push (policy);
      });

      return resolved.length > 0 ? new AnyPolicy ({policies: resolved}) : null;
    }
  });
};
