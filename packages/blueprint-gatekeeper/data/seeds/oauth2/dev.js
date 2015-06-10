
var mongoose = require ('mongoose')
  , winston  = require ('winston')
  , async    = require ('async')
  , uid      = require ('uid-safe')
  , models   = require ('../../../lib/models')
  , oauth2   = models.oauth2
  ;

const TOKEN_LENGTH = 256;
const CONNECTION_STRING = 'mongodb://localhost/gatekeeper-dev';

mongoose.connect (CONNECTION_STRING);

var accounts = [
  {_id: new mongoose.Types.ObjectId, username: 'admin_d@gatekeeper.com', password: 'admin_d'},
]

var clients = [
  {_id: new mongoose.Types.ObjectId, name: 'Gatekeeper Portal', secret: '0987654321', redirect_uri: 'http://localhost:5000/redirect' },
  {_id: new mongoose.Types.ObjectId, name: 'Test Client 1', secret: 'abc123', redirect_uri: 'http://localhost:5000/client1/redirect' },
  {_id: new mongoose.Types.ObjectId, name: 'Test Client 2', secret: 'xyz890', redirect_uri: 'http://localhost:5000/client2/redirect' },
  {_id: new mongoose.Types.ObjectId, name: 'Test Client 3 (disabled)', secret: 'xyz890', redirect_uri: 'http://localhost:5000/client3/redirect', disabled: true},
  {_id: new mongoose.Types.ObjectId, name: 'Test Client 4 (direct login)', secret: '12xdft', redirect_uri: 'http://localhost:5000/client4/redirect'}
];

var tokens = [
  { token : uid.sync (TOKEN_LENGTH), refresh_token : uid.sync (TOKEN_LENGTH), account : accounts[0]._id, client : clients[0]._id}
];

async.series(
  [
    function (callback) { models.Account.remove ({}, callback); },
    function (callback) { models.Account.create (accounts, callback);},

    function (callback) { oauth2.Client.remove ({}, callback); },
    function (callback) { oauth2.Client.create (clients, callback); },

    function (callback) { oauth2.AccessToken.remove ({}, callback); },
    function (callback) { oauth2.AccessToken.create (tokens, callback); }
  ],
  function (err, result) {
    process.exit (err ? 0 : 1);
  }
);
