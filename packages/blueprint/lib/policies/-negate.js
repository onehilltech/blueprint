const Policy = require ('../policy');
const Check  = require ('./-check');

const {
  isBoolean
} = require ('lodash');

/**
 * @class NegatePolicy
 *
 * A proxy policy that negates any policy.
 */
const NegatePolicy = Policy.extend ({
  policy: null,

  /**
   * Run the check.
   *
   * If the value is boolean, then we just negate the value. Otherwise, we
   * assume it is an failure object. This means the policy actually passes.
   *
   * If the check errors, then we just bubble the error.
   *
   * @param req
   * @returns {Promise<any>}
   */
  runCheck (req) {
    let result = this.policy.runCheck (req);

    return Promise.resolve (result).then (result => {
      return isBoolean (result) ? !result : true;
    });
  }
});

/**
 * @class NegatePolicy
 *
 * A utility policy for negating the value of a policy.
 */
module.exports = function (check) {
  return new Check ({
    resolvePolicyFrom (policies) {
      let policy = check.resolvePolicyFrom (policies);
      return !!policy ? new NegatePolicy ({policy}) : null;
    }
  })
};
