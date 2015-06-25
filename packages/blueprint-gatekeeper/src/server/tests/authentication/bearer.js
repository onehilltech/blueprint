var request     = require ('supertest')
  , assert      = require ('assert')
  , passport    = require ('passport')
  , express     = require ('express')
  , mongoose    = require ('mongoose')
  , winston     = require ('winston')
  , lib         = require ('../../lib')
  , Account     = lib.models.Account
  , AccessToken = lib.models.oauth2.AccessToken
  , Client      = lib.models.oauth2.Client
  , config      = require ('../config')
  ;

var Schema = mongoose.Schema;

describe ('BearerStrategy', function () {
  var tester = { email : 'test@me.com', password : '123abc' };
  var client = { name : 'client1', secret : 'secret', redirect_uri : 'http://www.testme.com', disabled : false };
  var access_token = { token : '1234567890', refresh_token : '0987654321', disabled : {type: Boolean, default : false} };

  // Use the local authentication strategy.
  passport.use (lib.auth.bearer ());

  // Setup the different routes for testing.
  winston.info ('creating new server for test suite');
  var app = express ();
  app.use (passport.initialize ());

  app.get ('/protected/resource',
    [
      passport.authenticate ('bearer', {session: false}),
      function (req, res) {
        res.send (200, {result: true});
      }
    ]);

  before (function (done) {
    mongoose.connect (config.connstr, config.mongodb, function (err) {
      if (err) return done (err);

      Account.create (tester, function (err, user) {
        if (err) return done (err);

        tester.id = user.id;
        access_token.account = user.id;

        Client.create (client, function (err, cli) {
          if (err) return done (err);

          winston.info ('test client created');

          client.id = cli.id;
          access_token.client = cli.id;

          // Create the test access token.
          AccessToken.create (access_token, function (err, at) {
            if (err) return done (err);

            winston.info ('test access token created');
            access_token.id = at.id;

            return done ();
          });
        });
      });
    });
  });

  after (function (done) {
    Account.remove ({}, function (err) {
      Client.remove ({}, function (err) {
        AccessToken.remove ({}, function (err) {
          mongoose.connection.close (function (err) {
            return done (err);
          });
        });
      });
    });
  });

  // TEST CASES

  describe ('require', function () {
    it ('should import a function', function () {
      assert.equal ('function', typeof (lib.auth.bearer));
    });
  });

  describe ('authentication', function () {
    it ('should return unauthorized access', function (done) {
      request (app)
        .get ('/protected/resource')
        .expect (401, { }, done);
    });

    it ('should authenticate using access token', function (done) {
      request (app)
        .get ('/protected/resource')
        .set ('Authorization', 'Bearer ' + access_token.token)
        .expect (200, {result : true}, done);
    });
  });
});
