var request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../../fixtures/datamodel')
  , blueprint = require ('../../../../fixtures/blueprint')
  , bm = blueprint.messaging
  ;

var Account = blueprint.app.models.Account
  ;

describe ('AccountRouter', function () {
  var server;
  var userToken;
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

  before (function (done) {
    server = blueprint.app.server;
    async.series ([
      // 1. apply the datamodel
      function (callback) {
        datamodel.apply (callback);
      },

      // 2. get the user token for the tests.
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.data.accounts[0].access_credentials.username,
          password: datamodel.data.accounts[0].access_credentials.password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          userToken = token;
          return callback ();
        });
      },

      // 3. get a client token for the tests.
      function (callback) {
        var data = {
          grant_type: 'client_credentials',
          client_id: datamodel.models.clients[0].id,
          client_secret: datamodel.models.clients[0].secret,
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          clientToken = token;
          return callback ();
        });
      }
    ], done);
  });

  describe ('GET /v1/accounts', function () {
    it ('should return all the accounts', function (done) {
      Account.find ({}, '-__v', function (err, accounts) {
        if (err) return done (err);

        request (server.app)
          .get ('/v1/accounts')
          .set ('Authorization', 'Bearer ' + userToken)
          .expect (200, JSON.stringify (accounts), done);
      });
    });
  });

  describe ('POST /v1/accounts', function () {
    var data = {
      username: 'tester1',
      password: 'tester1',
      email: 'james@onehilltech.com'
    };

    it ('should create a new account', function (done) {
      // We know the account was created when we get an event for
      // sending an account activation email.
      bm.once ('gatekeeper.email.account_activation.sent', function (account, info) {
        expect (account.profile.email).to.equal (data.email);
        expect (account.internal_use.created_by.id).to.equal (datamodel.models.clients[0].id);

        expect (info).to.have.deep.property ('envelope.from', 'noreply@onehilltech.com');
        expect (info).to.have.deep.property ('envelope.to[0]', data.email);
        expect (info).to.have.property ('messageId');

        done ();
      });

      request (server.app)
        .post ('/v1/accounts').send (data)
        .set ('Authorization', 'Bearer ' + clientToken)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);
          expect (res.body).to.have.keys (['_id']);

          // NOTE Test is done when we receive the message that email was sent.
        });
    });

    it ('should not create a new account [invalid role]', function (done) {
      var clientData = {
        grant_type: 'client_credentials',
        client_id: datamodel.models.clients[1].id,
        client_secret: datamodel.models.clients[1].secret
      };

      getToken (clientData, function (err, token) {
        if (err) return done (err);

        request (server.app)
          .post ('/v1/accounts').send (data)
          .set ('Authorization', 'Bearer ' + token)
          .expect (403, done);
      });
    });
  });
});