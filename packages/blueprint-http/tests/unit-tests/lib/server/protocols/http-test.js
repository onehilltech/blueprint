const {expect} = require ('chai');

const blueprint = require ('@onehilltech/blueprint');
const http = require ('http');
const Http = require ('../../../../../lib/server/protocols/http');

describe ('lib | server | protocols | Http', function () {
  describe ('createProtocol', function () {
    it ('should create a http protocol with default options', function () {
      const { server: { connections: { insecure } } } = blueprint.app.lookup ('service:http');

      expect (insecure).to.be.instanceof (Http);
      expect (insecure).to.have.property ('options').to.deep.include ({port: 10000});
      expect (insecure).to.have.property ('server').instanceof (http.Server);
    });
  });
});
