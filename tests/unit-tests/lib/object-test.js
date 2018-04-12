const BlueprintObject = require ('../../../lib/object');
const Mixin = require ('../../../lib/mixin');

const { expect } = require ('chai');

describe ('lib | BlueprintObject', function () {
  const keys = ['get','coalesce','empty','set','del','insert','push','ensureExists','has'];

  context ('class', function () {
    it ('should not have functions from objectPath', function () {
      expect (BlueprintObject).to.not.include.keys (keys);
    });
  });

  context ('extend', function () {
    it ('should extend base object with no additional properties', function () {
      const A = BlueprintObject.extend ();
      expect (A).to.be.a ('function');
    });

    it ('should extend base object with properties', function () {
      const A = BlueprintObject.extend ({
        a () { },
        b () { }
      });

      expect (A.prototype).to.have.keys (['a','b']);
    });

    it ('should extend base object with mixins and properties', function () {
      const M = Mixin.create ({
        z () {}
      });

      const A = BlueprintObject.extend (M, {
        a () { },
        b () { }
      });

      expect (A.prototype).to.have.keys (['a','b','z']);

    });
  });

  context ('instance', function () {
    it ('should have functions from objectPath', function () {
      expect (new BlueprintObject ()).to.include.keys (keys);
    });
  });
});
