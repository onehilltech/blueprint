const {
  expect
} = require ('chai');

const any = require ('../../../../lib/policies/any');
const check = require ('../../../../lib/policies/check');
const Policy = require ('../../../../lib/policy');

describe ('lib | policies | any', function () {
  let policies = {
    identity : Policy.extend ({
      setParameters (value) {
        this.value = value;
      },

      runCheck () { return this.value; }
    })
  };

  it ('should pass any policies', function (done) {
    let a = any ([
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
    let a = any ([
      check ('identity', true),
      check ('identity', false)
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done (null);
    }).catch (done);
  });

  it ('should fail since all policies fail', function (done) {
    let a = any ([
      check ('identity', false),
      check ('identity', false)
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ()
      .then (result => {
        expect (result).to.be.false;
        done ();
      }).catch (done);
  });

  it ('should support nested policies', function (done) {
    let a = any ([
      check ('identity', false),
      check ('identity', false),

      any ([
        check ('identity', false),
        check ('identity', true),
      ])
    ]);

    let policy = a.resolvePolicyFrom (policies);

    policy.runCheck ().then (result => {
      expect (result).to.be.true;
      return done ();
    }).catch (done);
  });
});
