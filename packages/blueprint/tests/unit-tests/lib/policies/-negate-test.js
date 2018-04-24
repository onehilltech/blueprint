const {
  expect
} = require ('chai');

const all = require ('../../../../lib/policies/-negate');
const check = require ('../../../../lib/policies/check');
const Policy = require ('../../../../lib/policy');

describe ('lib | policies | -negate', function () {
  let policies = {
    identity : Policy.extend ({
      setParameters (value) {
        this.value = value;
      },

      runCheck () { return this.value; }
    })
  };

  it ('should negate a true to false', function (done) {
    let c = check ('!identity', true);
    let policy = c.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.false;
      return done (null);
    }).catch (done);
  });

  it ('should negate a false to true', function (done) {
    let c = check ('!identity', false);
    let policy = c.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });

  it ('should negate a failure object to true', function (done) {
    let c = check ('!identity', {failureCode: 'failed', failureMessage: 'The message'});
    let policy = c.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });
});
