const {
  expect
} = require ('chai');

const all = require ('../../../../lib/policies/all');
const check = require ('../../../../lib/policies/check');
const blueprint = require ('../../../../lib');

describe ('lib | policies | all', function () {
  it ('should pass all policies', function () {
    const Policy = all ([
      check ('identity', true),
      check ('identity', true)
    ]);

    const policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  it ('should fail since one policy fails', function () {
    let Policy = all ([
      check ('identity', true),
      check ('identity', false)
    ], 'second_failed', 'The second policy failed.');

    let policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.eql ({
        failureCode: 'policy_failed',
        failureMessage: 'The request did not satisfy a required policy.'
      })
    });
  });

  it ('should support nested policies', function () {
    let Policy = all ([
      check ('identity', true),
      check ('identity', true),

      all ([
        check ('identity', true),
        check ('identity', true),
      ])
    ]);

    let policy = new Policy ({app: blueprint.app});

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });
});
