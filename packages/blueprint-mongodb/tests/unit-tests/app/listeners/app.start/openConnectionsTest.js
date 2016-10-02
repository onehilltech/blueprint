var blueprint = require ('@onehilltech/blueprint')
  , path = require ('path')
  , async = require ('async')
  ;

var appPath = path.resolve (__dirname, '../../../../fixtures/app');

describe ('listeners: app.start: openConnections', function () {
  it ('should open all connections to the database', function (done) {

    blueprint.testing.createApplicationAndStart (appPath, function (err) {
      if (err) return done (err);
      var mongodb = require ('../../../../../lib');

      async.every (mongodb.connections, function (conn, callback) {
        var readyState = conn.readyState;
        return callback (null, readyState === 1 || readyState === 2);
      }, done);
    });
  });
});
