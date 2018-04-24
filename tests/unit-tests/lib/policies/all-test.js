const {
  expect
} = require ('chai');

const all = require ('../../../../lib/policies/all');
const check = require ('../../../../lib/policies/check');
const Policy = require ('../../../../lib/policy');

describe ('lib | policies | all', function () {
  let policies = {
    identity : Policy.extend ({
      setParameters (value) {
        this.value = value;
      },

      runCheck () { return this.value; }
    })
  };


  it ('should pass all policies', function (done) {
    let a = all ([
      check ('identity', true),
      check ('identity', true)
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });

  it ('should fail since one policy fails', function (done) {
    let a = all ([
      check ('identity', true),
      check ('identity', false)
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ()
      .then (result => {
        expect (result).to.deep.equal ({
          failureCode: "policy_failed",
          failureMessage: "The request did not satisfy a required policy."
        });

        done (null);
      }).catch (done);
  });

  it ('should support nested policies', function (done) {
    let a = all ([
      check ('identity', true),
      check ('identity', true),

      all ([
        check ('identity', true),
        check ('identity', true),
      ])
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });
});
