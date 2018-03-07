const {expect} = require ('chai');
const Server = require ('../../../../lib/server');
const path = require ('path');

describe ('lib | server | Server', function () {
  describe ('constructor', function () {
    it ('should create a server object', function () {
      const app = {};

      let server = new Server ({app});

      expect (server).to.not.be.null;
    });
  });

  describe ('configure', function () {
    it ('should configure the server using default configurations', function (done) {
      const app = { tempPath: '.temp' };

      const config = {
        protocols: {
          http: {},
          https: {}
        }
      };

      let server = new Server ({app});

      server.configure (config).then (s => {
        expect (server).to.equal (s);

        expect (s._express).to.not.be.null;
        expect (s._mainRouter).to.not.be.null;
        expect (s._uploader).to.not.be.null;
        expect (s._viewCachePath).to.equal (path.resolve ('.temp/views'));

        done (null);
      }).catch (err => done (err));
    });
  });
});
