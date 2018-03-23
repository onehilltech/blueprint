const Check  = require ('./-check');
const Policy = require ('../policy');

const {
  isObjectLike
} = require ('lodash');

/**
 * @class AllPolicy
 *
 * The composite policy that succeeds if all policies succeeds, or fails if one
 * policy fails.
 */
const AllPolicy = Policy.extend ({
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
        const value = results[i];

        if (value === false) {
          let failed = this.policies[i];

          return {failureCode: failed.failureCode, failureMessage: failed.failureMessage};
        }
        else if (isObjectLike (value)) {
          return value;
        }
      }

      return true;
    });
  }
});

/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * @param       checks        Array of checks
 */
module.exports = function (checks) {
  return new Check ({
    name: 'all',

    resolvePolicyFrom (policies) {
      // We need to covert each of the checks into a policy. We only include
      // in the final set the list of policies that actually exist.
      let resolved = [];

      checks.forEach (check => {
        let policy = check.resolvePolicyFrom (policies);

        if (policy != null)
          resolved.push (policy);
      });

      return resolved.length > 0 ? new AllPolicy ({policies: resolved}) : null;
    }
  });
};
