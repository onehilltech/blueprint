const BlueprintObject = require ('../../../lib/object');
const { expect } = require ('chai');

describe ('lib | BlueprintObject', function () {
  const keys = ['get','coalesce','empty','set','del','insert','push','ensureExists','has'];

  context ('class', function () {
    it ('should not have functions from objectPath', function () {
      expect (BlueprintObject).to.not.include.keys (keys);
    });
  });

  context ('instance', function () {
    it ('should have functions from objectPath', function () {
      expect (new BlueprintObject ()).to.include.keys (keys);
    });
  });
});
