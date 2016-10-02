var blueprint = require ('@onehilltech/blueprint')
  , path = require ('path')
  , expect = require ('chai').expect
  , async = require ('async')
  ;

var appPath = path.resolve (__dirname, '../../fixtures/app');

describe ('index', function () {
  var mongodb = null;

  before (function (done) {
    async.series ([
      function (callback) { blueprint.testing.createApplicationAndStart (appPath, callback); },
      function (callback) { mongodb = require ('../../../lib'); return callback (null); }
    ], done);
  });

  it ('should have a default connection', function () {
    expect (mongodb.connections).to.have.property ('$default');
  });

  describe ('model', function () {
    it ('should create a module on default connection', function () {
      var schema = new mongodb.Schema ({ first_name: String, last_name: String });

      mongodb.model ('user1', schema);
      expect (mongodb.defaultConnection.models).to.have.property ('user1');
    })
  });

  describe ('modelOn', function () {
    it ('should create a module on targeted connection', function () {
      var schema = new mongodb.Schema ({ first_name: String, last_name: String });

      mongodb.modelOn ('$default', 'user2', schema);
      var connections = mongodb.connections;

      expect (connections['$default'].models).to.have.property ('user2');
    })
  });
});