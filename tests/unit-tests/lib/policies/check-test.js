const {
  expect
} = require ('chai');

const Policy = require ('../../../../lib/policy');
const check = require ('../../../../lib/policies/check');

describe ('lib | policies | check', function () {
  it ('should create a policy check', function () {
    let policyCheck = check ('identity', true);

    expect (policyCheck).to.deep.include ({
      name: 'identity',
      params: [true],
      optional: false
    });

    let policy = policyCheck.resolvePolicyFrom ({
      identity : Policy.extend ({
        setParameters (value) {
          this.value = value;
        },

        runCheck () { return this.value; }
      })
    });

    expect (policy).to.be.instanceof (Policy);
    expect (policy.runCheck ()).to.be.true;
  });

  it ('should error because policy is not found', function () {
    let policyCheck = check ('identity', true);

    expect (policyCheck).to.deep.include ({
      name: 'identity',
      params: [true],
      optional: false
    });

    expect (() => { policyCheck.resolvePolicyFrom ({}) }).to.throw (Error);
  });

  it ('should not error on optional policy not found', function () {
    let policyCheck = check ('?identity', true);

    expect (policyCheck).to.deep.include ({
      name: 'identity',
      params: [true],
      optional: true
    });

    expect (policyCheck.resolvePolicyFrom({})).to.be.null;
  });
});
