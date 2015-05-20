var assert = require ('assert');
var lib = require ('../..');
var Account = lib.models.Account;

describe ('User', function () {
  describe ('schema defintion', function () {
    it ('should be named \'user\'', function () {
      assert.equal ('account', Account.modelName);
    });

    it ('should have 1 virtual method', function () {
      assert.equal (1, Object.keys (Account.schema.methods).length);
    });
  });
});
