var blueprint = require ('@onehilltech/blueprint')
  , bm        = blueprint.messaging
  , request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../fixtures/datamodel')
  ;

describe ('AccountRouter', function () {
  var server;
  var userToken;
  var clientToken;

  function getToken (data, callback) {
    request (server.app)
      .post ('/oauth2/token').send (data)
      .expect (200)
      .end (function (err, res) {
        if (err) return callback (err);
        return callback (null, res.body.access_token);
      });
  }

  before (function (done) {
    async.series ([
      function (callback) {
        server = blueprint.app.server;
        datamodel.apply (callback);
      },
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.rawModels.accounts[0].access_credentials.username,
          password: datamodel.rawModels.accounts[0].access_credentials.password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback (err);

          userToken = token;
          return callback ();
        });
      },
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

  describe ('GET /accounts', function () {
    it ('should return all the accounts', function (done) {
      request (server.app)
        .get ('/accounts')
        .set ('Authorization', 'Bearer ' + userToken)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          var accounts = res.body;
          expect (accounts).to.have.length (5);

          return done ();
        });
    });
  });

  describe ('POST /accounts', function () {
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
        expect (info).to.be.have.keys (['id', 'message']);

        done ();
      });

      request (server.app)
        .post ('/accounts').send (data)
        .set ('Authorization', 'Bearer ' + clientToken)
        .expect (200, 'true')
        .end (function (err, res) {
          if (err) return done (err);
        });
    });

    it ('should not create a new account', function (done) {
      var clientData = {
        grant_type: 'client_credentials',
        client_id: datamodel.models.clients[1].id,
        client_secret: datamodel.models.clients[1].secret
      };

      getToken (clientData, function (err, token) {
        if (err) return done (err);

        request (server.app)
          .post ('/accounts').send (data)
          .set ('Authorization', 'Bearer ' + token)
          .expect (403, done);
      });
    })
  });


  describe ('GET /accounts/:accountId/profile', function () {
    it ('should get the account profile', function (done) {
      var account = datamodel.models.accounts[0];

      request (server.app)
        .get ('/accounts/' + account.id + "/profile")
        .set ('Authorization', 'Bearer ' + userToken)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body.email).to.equal (account.profile.email);
          expect (res.body._id).to.equal (account.id);

          return done ();
        });
    });
  });
});