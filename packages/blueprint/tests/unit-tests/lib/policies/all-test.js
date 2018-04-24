const {
  expect
} = require ('chai');

const all = require ('../../../../lib/policies/all');
const check = require ('../../../../lib/policies/check');

describe ('lib | policies | all', function () {
  it ('should pass all policies', function () {
    const Policy = all ([
      check ('identity', true),
      check ('identity', true)
    ]);

    const policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });

  it ('should fail since one policy fails', function () {
    let Policy = all ([
      check ('identity', true),
      check ('identity', false)
    ], 'second_failed', 'The second policy failed.');

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.deep.equal ({
        failureCode: 'second_failed',
        failureMessage: 'The second policy failed.'
      });
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

    let policy = new Policy ();

    return policy.runCheck ().then (result => {
      expect (result).to.be.true;
    });
  });
});
