var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var datamodel  = require ('../../../../fixtures/datamodel')
  , appFixture = require ('../../../../fixtures/app')
  ;

describe ('ActivationRouter', function () {
  var server;
  var Account;
  var clientToken;

  function getToken (data, callback) {
    request (server.app)
      .post ('/v1/oauth2/token').send (data)
      .expect (200)
      .end (function (err, res) {
        if (err) return callback (err);
        return callback (null, res.body.access_token);
      });
  }

  function getActivationToken (data, callback) {
    async.waterfall ([
      function (callback) {
        request (server.app)
          .post ('/v1/accounts').send (data)
          .set ('Authorization', 'Bearer ' + clientToken)
          .expect (200, callback);
      },

      function (res, callback) {
        var accountId = res.body.account._id;
        Account.findById (accountId, callback);
      },

      function (account, callback) {
        return callback (null, account.activation.token);
      }
    ], callback);
  }

  before (function (done) {
    async.waterfall ([
      function (callback) { appFixture (callback); },

      // apply the datamodel
      function (app, callback) {
        server  = app.server;
        Account = app.models.Account;

        datamodel.apply (callback);
      },

      // get a client token for the tests.
      function (result, callback) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: datamodel.models.clients[0].secret
        };

        getToken (data, callback);
      }
    ], function (err, result) {
      if (err) return done (err);
      clientToken = result;

      return done ();
    });
  });

  describe ('GET /activate', function () {
    var activationToken1;

    it ('should activate the account', function (done) {
      var data = { email: 'me@gatekeeper.com', username: 'me', password: 'me' };

      async.waterfall ([
        function (callback) { getActivationToken (data, callback); },
        function (token, callback) {
          activationToken1 = token;

          request (server.app)
            .get ('/v1/activate?token=' + token)
            .expect (200, 'true', callback);
        }
      ], done);
    });

    it ('should not double activate the account', function (done) {
      request (server.app)
        .get ('/v1/activate?token=' + activationToken1)
        .expect (400, done);
    });

    it ('should activate the token, with redirect', function (done) {
      var data = { email: 'me2@gatekeeper.com', username: 'me2', password: 'me2' };

      async.waterfall ([
        function (callback) { getActivationToken (data, callback); },
        function (token, callback) {
          request (server.app)
            .get ('/v1/activate?token=' + token + '&redirect_uri=http://localhost:8080/activate')
            .expect (302, callback);
        }
      ], done);
    });
  });
});