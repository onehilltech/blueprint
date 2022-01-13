const HttpError = require ('../../../lib/http-error');
const {expect} = require ('chai');

describe ('lib | HttpError', function () {
  describe ('constructor', function () {
    it ('should create a HttpError', function () {
      let err = new HttpError (404, 'invalid', 'This was an invalid operation', {line: 25});

      expect (err).to.be.instanceof (Error);
      expect (err).to.deep.include ({statusCode: 404, code: 'invalid', message: 'This was an invalid operation', details: {line: 25}})
    });
  });

  describe ('accept()', function () {
    it ('should accept a visitor', function () {
      let e = new HttpError (400, 'invalid', 'This was an invalid operation', {line: 25});
      let complete = false;

      e.accept ({
        visitHttpError (err) {
          expect (e).to.equal (err);
          complete = true;
        }
      });

      expect (complete).to.be.true;
    })
  })
});
