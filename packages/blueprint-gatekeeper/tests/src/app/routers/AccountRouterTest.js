var blueprint = require ('@onehilltech/blueprint')
  , request   = require ('supertest')
  , expect    = require ('chai').expect
  , async     = require ('async')
  ;

var datamodel = require ('../../../fixtures/datamodel')
  , Account   = blueprint.app.models.Account;
  ;

describe ('AccountRouter', function () {
  var server;
  var accessToken;
  var clientToken;

  function getToken (data, callback) {
    request (server.app)
      .post('/oauth2/token').send (data)
      .expect (200)
      .end (function (err, res) {
        if (err)
          return callback (err);

        return callback (null, res.body.access_token);
    });
  }

  before(function (done) {
    async.series ([
      function (callback) {
        server = blueprint.app.server;
        blueprint.app.database.connect(callback);
      },
      function (callback) {
        datamodel.apply (callback);
      },
      function (callback) {
        var data = {
          grant_type: 'password',
          username: datamodel.rawModels.accounts[0].username,
          password: datamodel.rawModels.accounts[0].password,
          client_id: datamodel.models.clients[0].id
        };

        getToken (data, function (err, token) {
          if (err) return callback(err);

          accessToken = token;
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
      request(server.app)
        .get ('/accounts')
        .set ('Authorization', 'Bearer ' + accessToken)
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
    var accountData = {
      username: 'tester',
      password: 'tester',
      email: 'tester@gatekeeper.com'
    };

    it ('should create a new account', function (done) {
      request (server.app)
        .post ('/accounts').send (accountData)
        .set ('Authorization', 'Bearer ' + clientToken)
        .expect (200, 'true')
        .end (function (err, res) {
          // Make sure the newly created account is in the database.
          Account.findOne ({username: accountData.username, email: accountData.email}, function (err, account) {
            if (err) return done (err);

            expect (err).to.be.null;
            expect (account).to.not.be.undefined;
            expect (account.created_by).to.eql (datamodel.models.clients[0]._id);

            return done ();
          });
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
          .post ('/accounts').send (accountData)
          .set ('Authorization', 'Bearer ' + token)
          .expect (403, done);
      });
    });
  });
});