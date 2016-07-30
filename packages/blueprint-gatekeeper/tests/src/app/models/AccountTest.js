var expect = require ('chai').expect
  , async  = require ('async')
  ;

var appFixture = require ('../../../fixtures/app')
  ;

var data = {
  client : {
    name: 'client1',
    email: 'contact@client1.com',
    secret: 'client1',
    redirect_uri: 'https://client1.com/gatekeeper',
    roles: ['account.create']
  },

  account: {
    access_credentials: {username: 'account1', password: 'account1'},
    profile: {email: 'account1@gatekeeper.com'},
    internal_use: {}
  }
};


describe ('Account', function () {
  var account;
  var client;
  var app;

  var Account;
  var Client;

  before (function (done) {
    async.series ([
      function (callback) {
        appFixture (function (err, result) {
          if (err) return callback (err);

          app = result;

          Account = result.models.Account;
          Client  = result.models.Client;

          return callback ();
        });
      },
      function (callback) {
        Account.remove ({}, callback);
      },
      function (callback) {
        Client.remove ({}, callback);
      },
      function (callback) {
        client = new Client (data.client);

        client.save (function (err, model) {
          if (err) return callback (err);

          client = model;
          return callback ();
        });
      }
    ], done);
  });

  describe ('create and save', function () {
    it ('should save a new account to the database', function (done) {
      account = new Account (data.account);
      account.internal_use.created_by = client._id;

      account.save (function (err, model) {
        if (err) return done (err);

        account = model;
        return done ();
      });
    });
  });

  describe ('metadata', function () {
    var obj = {
      key1 : 'value1',
      key2 : 'value2'
    };

    it ('should put the metadata in the account', function (done) {
      account.metadata.test = obj;
      account.markModified ('metadata');

      account.save (function (err, model) {
        if (err) return done (err);

        account = model;
        return done ();
      });
    });

    it ('should get the metadata from the account', function (done) {
      Account.findById (account.id, function (err, account) {
        if (err) return done (err);

        expect (account.metadata).to.eql ({ test : obj });

        return done ();
      });
    });
  });
});