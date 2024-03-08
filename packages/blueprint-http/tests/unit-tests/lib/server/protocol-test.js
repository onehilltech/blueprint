const {expect} = require ('chai');
const Protocol = require ('../../../../src/lib/server/protocol');

describe ('lib | server | Protocol', function () {
  describe ('constructor', function () {
    it ('should create the object', function () {
      const p = new Protocol ();

      expect (p.server).to.be.undefined;
      expect (p.options).to.be.undefined;
    });
  })
});
