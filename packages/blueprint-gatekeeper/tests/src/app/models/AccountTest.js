var expect = require ('chai').expect;

var Account = require ('../../../../app/models/Account')
  ;

describe ('Account', function () {
  describe ('new Account', function () {
    var account = new Account ();

    it ('should create a new Account', function () {
      expect (account.roles).to.have.members (['user']);
    });
  });
});