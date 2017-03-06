var async     = require ('async')
  , winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  , testing   = require ('../../lib/testing')
  ;

const appPath  = require ('./appPath')
  , gatekeeper = require ('../../lib')
  ;

var Account = undefined
  , Client = undefined
  , AccessToken = undefined
  ;

var data = {
  accounts: [
    { email: 'account1@gatekeeper.com', username: 'account1', password: 'account1'},
    { email: 'account2@gatekeeper.com', username: 'account2', password: 'account2' },
    { email: 'account3@gatekeeper.com', username: 'account3', password: 'account3' },
    { email: 'account4@gatekeeper.com', username: 'account4', password: 'account4', scope: [gatekeeper.scope.superuser]},
    { email: 'account5@gatekeeper.com', username: 'account5', password: 'account5', enabled: false }
  ],

  access_tokens: [

  ]
};

exports.data = data;
exports.models = {};

function cleanup (done) {
  winston.log ('info', 'clearing data from database');
  mongodb.testing.clearData (done);
}

function seed (done) {
  winston.log ('info', 'seeding database with data');

  async.waterfall ([
    // Create the clients used for testing.
    function (callback) {
      var clients =
        [
          { firstId: 1, scope: [
            gatekeeper.scope.account.create,
            gatekeeper.scope.client.create,
            gatekeeper.scope.client.update,
            gatekeeper.scope.client.delete
          ]},

          { firstId: 2 },
          { firstId: 3, enabled: false }
        ];

      async.concat (clients, testing.clients.createTimes (1), function (err, clients) {
        if (err) return callback (err);

        exports.models.clients = clients;

        callback (null, clients[0]);
      });
    },

    function (client, callback) {
      // Update the created_by path on the accounts to the first client.
      for (var i = 0; i < data.accounts.length; ++i)
        data.accounts[i].created_by = client.id;

      Account.create (data.accounts, function (err, accounts) {
        if (err) return callback (err);

        exports.models.accounts = accounts;

        callback (null);
      });
    }
  ], function (err) {
    if (err) return done (err);
    
    winston.log ('info', 'done seeding the database');
    return done ();
  });
}

function apply (done) {
  winston.log ('info', 'applying datamodel to test cases');

  async.series ([
    function (callback) {
      blueprint.testing.createApplicationAndStart (appPath, function (err, app) {
        if (err) return callback (err);

        if (!Client) Client = app.models.Client;
        if (!Account) Account = app.models.Account;
        if (!AccessToken) AccessToken = app.models.oauth2.AccessToken;

        return callback (null, app);
      });
    },
    function (callback) { cleanup (callback); },
    function (callback) { seed (callback); }
  ], done);
}

exports.apply = apply;
exports.cleanup = cleanup;
