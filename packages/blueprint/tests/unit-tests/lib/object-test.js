const BlueprintObject = require ('../../../lib/object');
const Mixin = require ('../../../lib/mixin');

const { expect } = require ('chai');

describe ('lib | BlueprintObject', function () {
  describe ('class', function () {
    it ('should have a set of class properties', function () {
      expect (BlueprintObject).to.have.keys (['PrototypeMixin','ClassMixin','extend','create']);
      expect (BlueprintObject).to.be.a ('function');
    });
  });

  describe ('extend', function () {
    it ('should extend base object with no additional properties', function () {
      const A = BlueprintObject.extend ();

      expect (A).to.be.a ('function');
      expect (A).to.have.keys (['PrototypeMixin','ClassMixin','extend','create']);
      expect (Object.keys (A.prototype)).to.have.length (0);

      let a = new A ();
      expect (Object.keys (a)).to.eql (['__boid__']);
    });

    it ('should extend base object with properties', function () {
      const A = BlueprintObject.extend ({
        name: 'John',
        a () { },
        b () { }
      });

      expect (A.prototype).to.have.keys (['a','b','name']);

      let a = new A ();
      expect (a.a).to.be.a ('function');
      expect (a.b).to.be.a ('function');
      expect (a.name).to.be.a ('string');
    });

    it ('should support multiple levels of inheritance', function () {
      const C1 = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const C2 = C1.extend ({
        a () {
          return this._super.call (this, ...arguments) + 2;
        }
      });

      const C3 = C2.extend ({
        a () {
          return this._super.call (this, ...arguments) + 3;
        }
      });

      const c = new C3 ();

      expect (c.a ()).to.equal (6);
    });

    it ('should override base methods', function () {
      const Base = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const A = Base.extend ({
        a ( ) {
          return this._super.call (this, ...arguments) + 2;
        }
      });

      const a = new A ();

      expect (a.a ()).to.equal (3);
    });

    it ('should overwrite base method', function () {
      const Base = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const A = Base.extend ({
        a ( ) {
          return 2;
        }
      });

      const a = new A ();

      expect (a.a ()).to.equal (2);
    });

    it ('should mixin an object', function () {
      const Base = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const M = Mixin.create ({
        z () {
          return 10;
        }
      });

      const A = Base.extend (M, {
        a ( ) {
          return 2;
        }
      });

      const a = new A ();

      expect (a.z ()).to.equal (10);
    });

    it ('should overwrite mixin', function () {
      const Base = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const M = Mixin.create ({
        z () {
          return 10;
        }
      });

      const A = Base.extend (M, {
        z ( ) {
          return 2;
        }
      });

      const a = new A ();

      expect (a.z ()).to.equal (2);
    });

    it ('should override mixin', function () {
      const Base = BlueprintObject.extend ({
        a () {
          return 1;
        }
      });

      const M = Mixin.create ({
        z () {
          return 10;
        }
      });

      const A = Base.extend (M, {
        z ( ) {
          return this._super.call (this, ...arguments) + 2;
        }
      });

      const a = new A ();

      expect (a.z ()).to.equal (12);
    });
  });

  describe ('create', function () {
    it ('should create an object', function () {
      const A = BlueprintObject.extend ({
        name: null,

        a () { }
      });

      let a = A.create ();

      expect (a.name).to.be.null;
    });

    it ('should initialize properties', function () {
      const A = BlueprintObject.extend ({
        name: null,

        a () {

        }
      });

      let a = A.create ({
        name: 'Jack'
      });

      expect (a.name).to.equal ('Jack');
    });
  });
});
