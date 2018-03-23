const Policy = require ('./policy');

const {
  isString,
  isObjectLike
} = require ('lodash');

/**
 * @class LegacyPolicy
 *
 * This is a class adapter for legacy policies. A legacy policy is one that exports
 * a f(req, callback) instead of a Policy class.
 *
 *
 */
module.exports = Policy.extend ({
  policy: null,

  runCheck (req) {
    return new Promise ((resolve, reject) => {
      this.policy (req, (err, result, details) => {
        if (!err)
          return reject (err);

        if (!result && details) {
          let policyError;

          // There are details associated with the result. This can either be
          // a string, or a details object.

          if (isString (details)) {
            policyError = {
              reason: 'policy_failed',
              message: details
            };
          }
          else if (isObjectLike (details)) {
            policyError = details;
          }
          else {
            // TODO Should we throw an exception here?!
          }

          req._policyErrors.push (policyError);
        }

        return resolve (result);
      });
    });
  }
});
