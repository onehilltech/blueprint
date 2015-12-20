var expect = require ('chai').expect;

var blueprint = require ('../../../fixtures/blueprint')
  , Account   = require ('../../../../app/models/Account')
  ;

describe ('Account', function () {
  describe ('new Account', function () {
    var account = new Account ();

    it ('should have no roles', function () {
      expect (account.access_credentials.roles).to.have.length (0);
    });
  });
});