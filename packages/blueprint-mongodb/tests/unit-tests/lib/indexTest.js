var blueprint = require ('@onehilltech/blueprint')
  , expect    = require ('chai').expect
  , mongodb   = require ('../../../lib')
  ;

describe ('index', function () {
  var connMgr;

  before (function () {
    connMgr = mongodb.getConnectionManager ();
  });

  describe ('model', function () {
    it ('should create a module on default connection', function () {
      var schema = new mongodb.Schema ({ first_name: String, last_name: String });
      mongodb.model ('user1', schema);

      expect (connMgr.defaultConnection.models).to.have.property ('user1');
    })
  });

  describe ('modelOn', function () {
    it ('should create a module on targeted connection', function () {
      var schema = new mongodb.Schema ({ first_name: String, last_name: String });
      mongodb.modelOn ('$default', 'user2', schema);

      var connections = connMgr.connections;

      expect (connections['$default'].models).to.have.property ('user2');
    })
  });
});