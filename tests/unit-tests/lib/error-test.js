const BlueprintError = require ('../../../lib/error');
const {expect} = require ('chai');

describe ('lib | BlueprintError', function () {
  describe ('constructor', function () {
    it ('should create a BlueprintError', function () {
      let err = new BlueprintError ('invalid', 'This was an invalid operation', {line: 25});

      expect (err).to.be.instanceof (Error);
      expect (err).to.deep.include ({code: 'invalid', message: 'This was an invalid operation', details: {line: 25}})
    });
  });

  describe ('accept()', function () {
    it ('should accept a visitor', function () {
      let e = new BlueprintError ('invalid', 'This was an invalid operation', {line: 25});

      e.accept ({
        visitBlueprintError (err) {
          expect (e).to.equal (err);
        }
      })
    })
  })
});
