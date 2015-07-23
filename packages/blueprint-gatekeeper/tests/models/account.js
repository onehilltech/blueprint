var assert = require ('assert');
var lib = require ('../../lib');
var Account = lib.models.Account;

describe ('Account', function () {
  describe ('schema definition', function () {
    it ('should have 1 virtual method', function () {
      assert.equal (1, Object.keys (Account.schema.methods).length);
    });
  });
});
