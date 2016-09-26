var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , appHelper = require ('../../../../app')
  , async = require ('async')
  ;

describe ('listeners: app.start: openConnections', function () {
  before (function (done) {
    appHelper (done);
  });

  it ('should open all connections to the database', function (done) {
    var mongodb = require ('../../../../../lib');
    messaging.emit ('app.start', blueprint.app);

    async.every (mongodb.connections, function (conn, callback) {
      var readyState = conn.readyState;
      return callback (null, readyState === 1 || readyState === 2);
    }, done);
  });
});
