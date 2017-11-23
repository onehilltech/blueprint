const policy = require ('../../../../../../app/policies/gatekeeper/request/scopes')
  , expect   = require ('chai').expect
  ;

describe ('app | policies | gatekeeper | request | scopes', function () {
  context ('no pattern', function () {
    it ('the policy should pass', function (done) {
      let req = { scope: ['a.b', 'a.c'] };

      policy (['a.b', 'a.c'], req, (err, result) => {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done (null);
      });
    });

    it ('the policy should fail', function (done) {
      let req = { scope: ['a.b', 'a.c'] };

      policy (['a.b', 'a.d'], req, (err, result, details) => {
        expect (err).to.be.null;
        expect (result).to.be.false;
        expect (details).to.deep.equal ({reason: 'invalid_scope', message: 'This request does not have a valid scope.'});

        return done (null);
      });
    });
  });

  context ('glob pattern', function () {
    it ('the policy should pass', function (done) {
      let req = { scope: ['a.b.*'] };

      policy (['a.b.c', 'a.b.d'], req, (err, result) => {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done (null);
      });
    });

    it ('the policy should fail', function (done) {
      let req = { scope: ['a.b.*'] };

      policy (['a.c.d', 'a.b.c'], req, (err, result, details) => {
        expect (err).to.be.null;
        expect (result).to.be.false;
        expect (details).to.deep.equal ({reason: 'invalid_scope', message: 'This request does not have a valid scope.'});

        return done (null);
      });
    });
  });

});