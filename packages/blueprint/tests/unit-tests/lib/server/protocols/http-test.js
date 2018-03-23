const {expect} = require ('chai');
const Http = require ('../../../../../lib/server/protocols/http');
const http = require ('http');

describe ('lib | server | protocols | Http', function () {
  describe ('createProtocol', function () {
    it ('should create a http protocol with default options', function () {
      const options = {};
      let p = Http.createProtocol ((req, res) => { }, options);

      expect (p).to.be.instanceof (Http);
      expect (p).to.have.deep.property ('options', {port: 80});
      expect (p).to.have.property ('server').instanceof (http.Server);
    });

    it ('should create a http protocol with custom options', function () {
      const options = {host: 'localhost', port: 8080};
      let p = Http.createProtocol ((req, res) => { }, options);

      expect (p).to.be.instanceof (Http);
      expect (p).to.have.deep.property ('options', options);
      expect (p).to.have.property ('server').instanceof (http.Server);
    });
  });
});
