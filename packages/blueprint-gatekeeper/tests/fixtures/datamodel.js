var async   = require ('async')
  , winston = require ('winston')
  ;

var blueprint  = require ('./blueprint')
  , connect    = require ('./connect')
  , gatekeeper = require ('../../lib')
  ;

var Account     = blueprint.app.models.Account
  , Client      = blueprint.app.models.Client
  , AccessToken = blueprint.app.models.oauth2.AccessToken
  ;

var data = {
  clients: [
    {
      name: 'client1',
      email: 'contact@client1.com',
      secret: 'client1',
      redirect_uri: 'https://client1.com/gatekeeper',
      roles: [gatekeeper.roles.client.account.create]
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
    {
      access_credentials: {username: 'account1', password: 'account1'},
      profile: {email: 'account1@gatekeeper.com'},
      internal_use : {}
    },
    {
      access_credentials: {username: 'account2', password: 'account2', roles: [gatekeeper.roles.user.administrator]},
      profile: {email: 'account2@gatekeeper.com'},
      internal_use : {}
    },
    {
      access_credentials: {username: 'account3', password: 'account3'},
      profile: {email: 'account3@gatekeeper.com'},
      internal_use : {}
    },
    {
      access_credentials: {username: 'account4', password: 'account4'},
      profile: {email: 'account4@gatekeeper.com'},
      internal_use : {}
    },
    {
      access_credentials: {username: 'account5', password: 'account5'},
      profile: {email: 'account5@gatekeeper.com'},
      internal_use: {enabled: false}
    }
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
        data.accounts[i].internal_use.created_by = client.id;

      // Insert the participants into the database.
      winston.log ('info', 'adding accounts to the database');

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
    function (callback) { connect (callback); },
    function (callback) { cleanup (callback); },
    function (callback) { seed (callback); }
  ], done);
};

exports.cleanup = cleanup;