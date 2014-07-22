var assert = require ('assert'),
    lib    = require ('../..'),
    User   = lib.models.User;

describe ('User', function () {
  describe ('schema defintion', function () {
    it ('should be named \'user\'', function () {
      assert.equal ('user', User.modelName);
    });

    it ('should have 1 virtual method', function () {
      assert.equal (1, Object.keys (User.schema.methods).length);
    });
  });
});
