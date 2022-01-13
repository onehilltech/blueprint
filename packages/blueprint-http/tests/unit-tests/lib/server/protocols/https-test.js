const {expect} = require ('chai');

const blueprint = require ('../../../../../lib');
const Https = require ('../../../../../lib/server/protocols/https');
const https = require ('https');

describe ('lib | server | protocols | Https', function () {
  describe ('createProtocol', function () {
    it ('should create a https protocol with default options', function () {
      const { server: { connections: { secure } } } = blueprint.app;

      expect (secure).to.be.instanceof (Https);
      expect (secure).to.have.property ('options').to.deep.include ({port: 8443});
      expect (secure).to.have.property ('server').instanceof (https.Server);
    });
  });
});
