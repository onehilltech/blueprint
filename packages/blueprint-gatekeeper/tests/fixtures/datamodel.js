var async   = require ('async')
  , winston = require ('winston')
  ;

var blueprint = require ('./blueprint')
  ;

var Account     = blueprint.app.models.Account
  , Client      = blueprint.app.models.Client
  , AccessToken = blueprint.app.models.oauth2.AccessToken
  ;

exports.models = {};

var rawClients = [
  {name: 'client1', email: 'contact@client1.com', secret: 'client1', redirect_uri: 'https://client1.com/gatekeeper', roles: ['account.create']},
  {name: 'client2', email: 'contact@client2.com', secret: 'client2', redirect_uri: 'https://client2.com/gatekeeper'},
  {name: 'client3', email: 'contact@client3.com', secret: 'client3', redirect_uri: 'https://client3.com/gatekeeper', enabled: false}
];

var rawAccounts = [
  {
    access_credentials: {username: 'account1', password: 'account1'},
    profile: {email: 'account1@gatekeeper.com'},
    internal_use : {}
  },
  {
    access_credentials: {username: 'account2', password: 'account2'},
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
];

exports.rawModels = {
  accounts: rawAccounts,
  clients : rawClients
};

function cleanup (done) {
  async.series ([
      function (cb) { Account.remove ({}, cb); },
      function (cb) { Client.remove ({}, cb); },
      function (cb) { AccessToken.remove ({}, cb)}
    ], done);
}

exports.apply = function (done) {
  cleanup (function () {
    async.waterfall ([
        function (callback) {
          winston.log ('info', 'adding clients to the database');

          Client.create (rawClients, function (err, clients) {
            if (err)
              return callback (err);

            exports.models.clients = clients;
            callback (null, clients[0]);
          });
        },
        function (client, callback) {
          // Update the created_by path on the accounts to the first client.
          for (var i = 0; i < rawAccounts.length; ++ i)
            rawAccounts[i].internal_use.created_by = client.id;

          // Insert the participants into the database.
          winston.log ('info', 'adding accounts to the database');

          Account.create (rawAccounts, function (err, accounts) {
            if (err) return callback (err);

            exports.models.accounts = accounts;
            callback (null);
          });
        }
      ],
      function (err) {
        return done (err);
      });
  });
};

exports.cleanup = cleanup;