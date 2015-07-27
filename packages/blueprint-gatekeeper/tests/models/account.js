var assert = require ('assert');

var db      = require ('../fixtures/db')
  , Account = require ('../../lib/models/account')
  ;

describe ('Account', function () {
  before (function (done) {
    db.connect (done);
  });

  describe ('schema definition', function () {
    it ('should have 1 virtual method', function () {
      assert.equal (1, Object.keys (Account.schema.methods).length);
    });

    it ('should save the account to the database', function (done) {
      var account = new Account ({
        username : 'tester',
        password : 'tester',
        email    : 'tester@test.com'
      });

      console.log ('saving the account');

      account.save (function (err, account) {
        console.log ('account has been saved')
        done (err);
      });
    });
  });
});
