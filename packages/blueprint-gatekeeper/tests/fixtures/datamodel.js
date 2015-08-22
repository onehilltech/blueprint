var blueprint = require ('blueprint')
  , async     = require ('async')
  ;

var Account = blueprint.models.Account
  , Client  = blueprint.models.Client
  ;

exports.models = {};

var rawClients = [
  {name: 'client1', email: 'contact@client1.com', secret: 'client1', redirect_uri: 'https://client1.com/gatekeeper', roles: ['account_create']},
  {name: 'client2', email: 'contact@client2.com', secret: 'client2', redirect_uri: 'https://client2.com/gatekeeper'},
  {name: 'client3', email: 'contact@client3.com', secret: 'client3', redirect_uri: 'https://client3.com/gatekeeper', enabled: false}
];

var rawAccounts = [
  {username: 'account1', password: 'account1', email: 'contact@account1.com'},
  {username: 'account2', password: 'account2', email: 'contact@account2.com'},
  {username: 'account3', password: 'account3', email: 'contact@account3.com'},
  {username: 'account4', password: 'account4', email: 'contact@account4.com'},
  {username: 'account5', password: 'account5', email: 'contact@account5.com', enabled: false},
];

exports.rawModels = {
  accounts: rawAccounts,
  clients : rawClients
};

function cleanup (done) {
  async.series ([
      function (cb) { Account.remove ({}, cb); },
      function (cb) { Client.remove ({}, cb); }
    ],
    function (err) { return done (err); });
}

exports.apply = function (done) {
  cleanup (function () {
    async.series ([
        function (callback) {
          // Insert the participants into the database.
          Account.create (rawAccounts, function (err, accounts) {
            if (err)
              return callback (err);

            exports.models.accounts = accounts;
            callback (null);
          });
        },
        function (callback) {
          Client.create (rawClients, function (err, clients) {
            if (err)
              return callback (err);

            exports.models.clients = clients;
            callback (null);
          });
        }
      ],
      function (err, results) {
        return done (err);
      });
  });
};

exports.cleanup = cleanup;