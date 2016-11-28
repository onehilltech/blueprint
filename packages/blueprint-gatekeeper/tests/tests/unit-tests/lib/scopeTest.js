const expect = require ('chai').expect
  , scope = require ('../../../../lib/scope')
  ;

describe ('scope', function () {
  it ('should define a superuser', function () {
    expect (scope.superuser).to.equal ('*');
  });

  it ('should define client scopes', function () {
    expect (scope.client).to.eql ({
      create: 'gatekeeper.client.create',
      getall: 'gatekeeper.client.getall',
      update: 'gatekeeper.client.update',
      delete: 'gatekeeper.client.delete',
      count: 'gatekeeper.client.count'
    });
  });

  it ('should define account scopes', function () {
    expect (scope.account).to.eql ({
      create: 'gatekeeper.account.create',
      getall: 'gatekeeper.account.getall',
      update: 'gatekeeper.account.update',
      delete: 'gatekeeper.account.delete',
      count:  'gatekeeper.account.count'
    });
  });

  describe ('compile', function () {
    describe ('standard', function () {
      const name = 'gatekeeper.account.create';
      const bad = 'gatekeeper.account.delete';

      var compiled;

      it ('should create a compiled scope', function () {
        compiled = scope.compile (name);
        expect (compiled.value).to.equal (name);
      });

      it ('should match valid scopes', function () {
        expect (compiled.match (name)).to.be.true;
        expect (compiled.match (bad)).to.be.false;
      });
    });

    describe ('global', function () {
      const name = 'gatekeeper.account.*';
      var compiled = scope.compile (name);

      describe ('#match', function () {
        const good = 'gatekeeper.account.create';
        const bad = 'gatekeeper.client.create';

        expect (compiled.match (name)).to.be.true;
        expect (compiled.match (good)).to.be.true;
        expect (compiled.match (bad)).to.be.false;
      });
    });
  })
});
