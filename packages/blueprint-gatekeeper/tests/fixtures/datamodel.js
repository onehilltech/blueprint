var async   = require ('async')
  , winston = require ('winston')
  ;

var appFixture = require ('./app')
  , roles      = require ('../../lib/roles')
  ;

var Account = undefined
  , Client = undefined
  , AccessToken = undefined
  ;

var data = {
  clients: [
    {
      name: 'client1',
      email: 'contact@client1.com',
      secret: 'client1',
      redirect_uri: 'https://client1.com/gatekeeper',
      roles: [roles.client.account.create]
    },
    {
      name: 'client2',
      email: 'contact@client2.com',
      secret: 'client2',
      redirect_uri: 'https://client2.com/gatekeeper'
    },
    {
      name: 'client3',
      email: 'contact@client3.com',
      secret: 'client3',
      redirect_uri: 'https://client3.com/gatekeeper',
      enabled: false
    }
  ],

  accounts: [
    { email: 'account1@gatekeeper.com', username: 'account1', password: 'account1' },
    { email: 'account2@gatekeeper.com', username: 'account2', password: 'account2', roles: [roles.user.administrator]},
    { email: 'account3@gatekeeper.com', username: 'account3', password: 'account3' },
    { email: 'account4@gatekeeper.com', username: 'account4', password: 'account4' },
    { email: 'account5@gatekeeper.com', username: 'account5', password: 'account5', enabled: false }
  ],

  access_tokens: [

  ]
};

exports.data = data;
exports.models = {};

function cleanup (done) {
  async.series ([
      function (cb) { Account.remove ({}, cb); },
      function (cb) { Client.remove ({}, cb); },
      function (cb) { AccessToken.remove ({}, cb)}
    ], done);
}

function seed (done) {
  async.waterfall ([
    function (callback) {
      winston.log ('info', 'adding clients to the database');

      Client.create (data.clients, function (err, clients) {
        if (err)
          return callback (err);

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

exports.apply = function (done) {
  winston.log ('info', 'applying datamodel to test cases');

  async.series ([
    function (callback) {
      appFixture (function (err, app) {
        if (err) return callback (err);

        Client = app.models.Client;
        Account = app.models.Account;
        AccessToken = app.models.oauth2.AccessToken;

        return callback ();
      });
    },
    function (callback) { cleanup (callback); },
    function (callback) { seed (callback); }
  ], done);
};

exports.cleanup = cleanup;