const {expect} = require ('chai');
const Protocol = require ('../../../../lib/server/protocol');

describe ('lib | server | Protocol', function () {
  describe ('constructor', function () {
    it ('should create the object', function () {
      let p = new Protocol ();

      expect (p.server).to.be.null;
      expect (p.options).to.be.null;
    });
  })
});
