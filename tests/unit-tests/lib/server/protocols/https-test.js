const {expect} = require ('chai');
const Https = require ('../../../../../lib/server/protocols/https');
const https = require ('https');

describe ('lib | server | protocols | Https', function () {
  describe ('createProtocol', function () {
    it ('should create a https protocol with default options', function () {
      const options = {};
      let p = Https.createProtocol ((req, res) => { }, options);

      expect (p).to.be.instanceof (Https);
      expect (p).to.have.property ('options').to.deep.include ({port: 443});
      expect (p).to.have.property ('server').instanceof (https.Server);
    });

    it ('should create a http protocol with custom options', function () {
      const options = {host: 'localhost', port: 8080};
      let p = Https.createProtocol ((req, res) => { }, options);

      expect (p).to.have.property ('options').to.deep.include (options);
    });
  });
});
