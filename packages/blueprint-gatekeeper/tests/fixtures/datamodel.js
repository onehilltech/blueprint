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
  clients: [
    {
      name: 'client1',
      email: 'client1@gatekeeper.com',
      secret: 'client1',
      scope: [
        gatekeeper.scope.account.create,
        gatekeeper.scope.client.create,
        gatekeeper.scope.client.update,
        gatekeeper.scope.client.delete
      ]
    },
    {
      name: 'client2',
      email: 'client2@gatekeeper.com',
      secret: 'client2'
    },
    {
      name: 'client3',
      email: 'client3@gatekeeper.com',
      secret: 'client3',
      enabled: false
    }
  ],

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

var models = {};

exports.data = data;
exports.models = models;

function cleanup (done) {
  winston.log ('info', 'clearing data from database');
  mongodb.testing.clearData (done);
}

function seed (done) {
  winston.log ('info', 'seeding database with data');

  async.waterfall ([
    /*
     * Add clients to the database.
     */
    function (callback) {
      Client.create (data.clients, callback);
    },

    /*
     * Add accounts to the database.
     */
    function (clients, callback) {
      models.clients = clients;

      for (var i = 0; i < data.accounts.length; ++i)
        data.accounts[i].created_by = models.clients[0].id;

      Account.create (data.accounts, callback);
    },

    /*
     * Save the accounts for access.
     */
    function (accounts, callback) {
      models.accounts = accounts;
      return callback (null);
    }
  ], done);
}

function apply (done) {
  winston.log ('info', 'applying data model for test cases');

  async.series ([
    function (callback) {
      blueprint.testing.createApplicationAndStart (appPath, function (err, app) {
        if (err) return callback (err);

        if (!Client)
          Client = app.models.Client;

        if (!Account)
          Account = app.models.Account;

        if (!AccessToken)
          AccessToken = app.models.AccessToken;

        return callback (null, app);
      });
    },
    function (callback) {
      cleanup (callback);
    },

    function (callback) {
      seed (callback);
    }
  ], done);
}

exports.apply = apply;
exports.cleanup = cleanup;
