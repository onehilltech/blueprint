const {expect} = require ('chai');

const blueprint = require ('../../../../../lib');
const Http = require ('../../../../../lib/server/protocols/http');
const http = require ('http');

describe ('lib | server | protocols | Http', function () {
  describe ('createProtocol', function () {
    it ('should create a http protocol with default options', function () {
      const { server: { connections: { insecure } } } = blueprint.app;

      expect (insecure).to.be.instanceof (Http);
      expect (insecure).to.have.property ('options').to.deep.include ({port: 10000});
      expect (insecure).to.have.property ('server').instanceof (http.Server);
    });
  });
});
