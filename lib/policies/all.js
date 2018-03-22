/**
 * Aggregate of policies that all must pass for this policy to pass.
 *
 * Ex.
 *
 * all ([
 *   ['policy1', arg1, arg2],
 *   ['policy2', arg1, arg2]
 * ])
 */
module.exports = (policies) => {
  return new Policy ({
    runCheck (req) {

    }
  })
};
