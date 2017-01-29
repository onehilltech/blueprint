var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

const datamodel = require ('../../../../../fixtures/datamodel')
  , bm = blueprint.messaging
  ;

describe ('AccountRouter', function () {
  var server;
  var userToken;
  var superUserToken;
  var clientToken;

  var Account;

  function getToken (data, callback) {
    request (server.app)
      .post ('/v1/oauth2/token').send (data)
      .expect (200)
      .end (function (err, res) {
        if (err) return callback (err);
        return callback (null, res.body.access_token);
      });
  }

  before (function (done) {
    async.series ([
      function (callback) {
        datamodel.apply (callback);
      },

      function (callback) {
        server  = blueprint.app.server;
        Account = blueprint.app.models.Account;
        return callback ();
      },

      // 2. get the user token for the tests.
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].username,
          password: datamodel.data.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          userToken = token;
          return callback ();
        });
      },

      // 2a. get the user token for an admin.
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[3].username,
          password: datamodel.data.accounts[3].password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          superUserToken = token;
          return callback ();
        });
      },

      // 3. get a client token for the tests.
      function (callback) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: datamodel.models.clients[0].secret
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          clientToken = token;
          return callback ();
        });
      }
    ], done);
  });

  describe ('/v1/accounts', function () {
    describe ('GET', function () {
      it ('should return all the accounts for an admin', function (done) {
        var projection = {
          '__v': 0,
          'password': 0
        };

        Account.find ({}, projection, function (err, accounts) {
          if (err) return done (err);

          request (server.app)
            .get ('/v1/accounts')
            .set ('Authorization', 'Bearer ' + superUserToken)
            .expect (200, {'accounts': JSON.parse (JSON.stringify (accounts))}, done);
        });
      });

      it ('should not allow non-admin access to all accounts', function (done) {
        request (server.app)
          .get ('/v1/accounts')
          .set ('Authorization', 'Bearer ' + userToken)
          .expect (403, done);
      });
    });

    describe ('POST', function () {
      var data = {
        username: 'tester1',
        password: 'tester1',
        email: 'james@onehilltech.com'
      };

      it ('should create a new account', function (done) {
        var accountId;

        // We know the account was created when we get an event for
        // sending an account activation email.
        bm.on ('gatekeeper.account.created', function (account) {
          accountId = account.id;
        });

        request (server.app)
          .post ('/v1/accounts')
          .send ({account: data})
          .set ('Authorization', 'Bearer ' + clientToken)
          .expect (200)
          .end (function (err, res) {
            if (err) return done (err);

            // Wait until the gatekeeper.account.created message is handled.
            async.waterfall ([
              function (callback) {
                async.whilst (
                  function () {
                    return accountId === undefined;
                  },
                  function (callback) {
                    setTimeout (function () {
                      callback (null);
                    }, 1000);
                  }, callback);
              },
              function (callback) {
                expect (res.body).to.deep.equal ({account: {_id: accountId}});
                Account.findById (accountId, callback);
              }
            ], done);
          });
      });

      it ('should not create an account [duplicate]', function (done) {
        request (server.app)
          .post ('/v1/accounts').send (data)
          .set ('Authorization', 'Bearer ' + clientToken)
          .expect (400, done);
      });

      it ('should not create an account [missing parameter]', function (done) {
        var invalid = {
          password: 'tester1',
          email: 'james@onehilltech.com'
        };

        request (server.app)
          .post ('/v1/accounts').send (invalid)
          .set ('Authorization', 'Bearer ' + clientToken)
          .expect (400, done);
      });

      it ('should not create an account [invalid role]', function (done) {
        var invalid = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[1].id,
          client_secret: datamodel.models.clients[1].secret
        };

        getToken (invalid, function (err, token) {
          if (err) return done (err);

          var account = {
            username: 'tester1',
            password: 'tester1',
            email: 'james@onehilltech.com'
          };

          request (server.app)
            .post ('/v1/accounts').send ({account: account})
            .set ('Authorization', 'Bearer ' + token)
            .expect (403, done);
        });
      });
    });
  });

  describe ('/v1/accounts/:accountId', function () {
    describe ('GET', function () {
      var projection = {
        '__v': 0,
        'password': 0
      };

      it ('should return the owner account', function (done) {
        var accountId = datamodel.models.accounts[0]._id;

        Account.findById (accountId, projection, function (err, account) {
          if (err) return done (err);

          request (server.app)
            .get ('/v1/accounts/' + accountId)
            .set ('Authorization', 'Bearer ' + userToken)
            .expect (200, {account: JSON.parse (JSON.stringify (account))}, done);
        });
      });

      it ('should retrieve a user account for an admin', function (done) {
        var accountId = datamodel.models.accounts[0]._id;

        Account.findById (accountId, projection, function (err, account) {
          if (err) return done (err);

          request (server.app)
            .get ('/v1/accounts/' + accountId)
            .set ('Authorization', 'Bearer ' + superUserToken)
            .expect (200, {account: JSON.parse (JSON.stringify (account))}, done);
        });
      });

      it ('should not allow non-admin access to another account', function (done) {
        var accountId = datamodel.models.accounts[1]._id;

        request (server.app)
          .get ('/v1/accounts/' + accountId)
          .set ('Authorization', 'Bearer ' + userToken)
          .expect (403, done);
      });
    });

    describe ('DELETE', function () {
      it ('should not allow non-admin to delete another user account', function (done) {
        var accountId = datamodel.models.accounts[2]._id;

        request (server.app)
          .delete ('/v1/accounts/' + accountId)
          .set ('Authorization', 'Bearer ' + userToken)
          .expect (403, done);
      });

      it ('should allow account owner to delete account', function (done) {
        var accountId = datamodel.models.accounts[0]._id;

        request (server.app)
          .delete ('/v1/accounts/' + accountId)
          .set ('Authorization', 'Bearer ' + userToken)
          .expect (200, 'true', done);
      });

      it ('should allow admin to delete user account', function (done) {
        var accountId = datamodel.models.accounts[2]._id;

        request (server.app)
          .delete ('/v1/accounts/' + accountId)
          .set ('Authorization', 'Bearer ' + superUserToken)
          .expect (200, 'true', done);
      });
    });
  });
});