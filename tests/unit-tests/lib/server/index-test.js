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
      const tempPath = path.resolve (__dirname, '../../../dummy/app/.temp');
      const app = { tempPath };

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
        expect (s._viewCachePath).to.equal (path.join (tempPath, 'views'));

        done (null);
      }).catch (err => done (err));
    });
  });

  describe ('importViews', function () {
    it ('should import view for use by the server', function (done) {
      const viewsPath = path.resolve (__dirname, '../../../dummy/app/views');
      const tempPath = path.resolve (__dirname, '../../../dummy/app/.temp');

      const app = { tempPath };

      let server = new Server ({app});

      server.configure ({}).then (() => {
        return server.importViews (viewsPath);
      }).then (() => {
        expect (server._engines).to.eql (['handlebars']);

        done (null);
      }).catch (done);
    });
  });
});
