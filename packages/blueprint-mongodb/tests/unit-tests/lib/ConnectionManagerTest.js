var ConnectionManager = require ('../../../lib/ConnectionManager')
  , expect = require ('chai').expect
  ;

describe ('ConnectionManager', function () {
  const DEFAULT_CONNECTION_NAME = '$default';
  const TEST_CONNECTION_NAME = 'ConnectionManagerTest';

  var connManager;

  describe ('ConnectionManager', function () {
    connManager = new ConnectionManager ({defaultConnection: DEFAULT_CONNECTION_NAME});
  });

  describe ('.createConnection', function () {
    it ('should create a new connection', function () {
      connManager.createConnection (TEST_CONNECTION_NAME);
      expect (connManager.connections).to.have.property (TEST_CONNECTION_NAME);
    })
  });

  describe ('.openConnection', function () {
    it ('should open an existing connection', function (done) {
      var opts = { connstr: 'mongodb://localhost/blueprint_mongodb_openConnectionTest' };
      connManager.openConnection (TEST_CONNECTION_NAME, opts, done);
    })
  });
});