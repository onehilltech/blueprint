const BlueprintObject = require ('../../../lib/object');
const computed = require ('../../../lib/properties/computed');
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

  context ('properties', function () {
    it ('should support computed property on types', function () {
      let Person = BlueprintObject.extend ({
        firstName: null,

        lastName: null,

        fullName: computed ({
          enumerable: true,
          get () { return `${this.firstName} ${this.lastName}`},
          set (value) {
            [this.firstName, this.lastName] = value.split (' ');
          }
        })
      });

      let p1 = new Person ({firstName: 'John', lastName: 'Doe'});
      let p2 = new Person ({firstName: 'Jane', lastName: 'Doe'});

      // test the getter
      expect (p1.fullName).to.equal ('John Doe');
      expect (p2.fullName).to.equal ('Jane Doe');

      // test the setter
      p1.fullName = 'Jack Black';
      expect (p1.firstName).to.equal ('Jack');
      expect (p1.lastName).to.equal ('Black');

      // test the enumerable
      let found;

      for (let key in p1) {
        found = (key === 'fullName');
        if (found) break;
      }

      expect (found).to.be.true;
    });

    it ('should support computed property on instances', function () {
      let Person = BlueprintObject.extend ({firstName: null, lastName: null});

      let p1 = Person.create ({
        firstName: 'John',
        lastName: 'Doe',
        fullName: computed ({
          enumerable: true,
          get () { return `${this.firstName} ${this.lastName}`},
          set (value) {
            [this.firstName, this.lastName] = value.split (' ');
          }
        })
      });

      let p2 = Person.create ({
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: computed ({
          enumerable: true,
          get () { return `${this.firstName} ${this.lastName}`},
          set (value) {
            [this.firstName, this.lastName] = value.split (' ');
          }
        })
      });

      // test the getter
      expect (p1.fullName).to.equal ('John Doe');
      expect (p2.fullName).to.equal ('Jane Doe');

      // test the setter
      p1.fullName = 'Jack Black';
      expect (p1.firstName).to.equal ('Jack');
      expect (p1.lastName).to.equal ('Black');

      // test the enumerable
      let found;

      for (let key in p1) {
        found = (key === 'fullName');
        if (found) break;
      }

      expect (found).to.be.true;
    });

    it ('should create a constant property', function () {
      let A = BlueprintObject.extend ({
        DEFAULT_VALUE: computed.constant (5)
      });
      
      let a = new A ();
      
      expect (a.DEFAULT_VALUE).to.equal (5);

      a.DEFAULT_VALUE = 10;

      expect (a.DEFAULT_VALUE).to.equal (5);
    });
  });
});
