'use strict';

const blueprint    = require ('@onehilltech/blueprint')
  , async          = require ('async')
  , mongodb        = require ('../../../../../lib')
  , testAppFactory = require ('../../../../fixtures/test-app')
  ;

describe ('listeners: app.start/openConnections', function () {
  it ('should open all connections to the database', function (done) {
    testAppFactory (function (err) {
      if (err)
        return done (err);

      async.every (mongodb.getConnectionManager ().connections, function (conn, callback) {
        var readyState = conn.readyState;
        return callback (null, readyState === 1 || readyState === 2);
      }, done);
    });
  });
});
