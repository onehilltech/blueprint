var request    = require ('supertest')
  , assert     = require ('assert')
  , express    = require ('express')
  , passport   = require ('passport')
  , winston    = require ('winston')
  , mongoose   = require ('mongoose')
  ;

var config       = require ('../../config')
  , seed         = require ('../../../data/seeds/default')
  , AccessToken  = require ('../../../lib/models/oauth2/accessToken')
  , Oauth2Router = require ('../../../lib/router/')
  ;

///////////////////////////////////////////////////////////////////////////////
// Begin Test Cases

describe ('Oauth2Router', function () {
  var user = seed.data.users[0];
  var client = seed.data.clients[0];

  var accessToken;
  var refreshToken;

  var app = express ();
  app.use (Oauth2Router (config));

  before (function (done) {
    mongoose.connect (config.connstr, config.mongodb, function () {
      seed.seed(function (err) {
        if (err)
          return done(err);

        AccessToken.newUserToken(256, client.id, user.id, function (err, at, rt) {
          if (err)
            return done(err);

          accessToken = at;
          refreshToken = rt;
          return done();
        });
      });
    });
  });

  after (function (done) {
    seed.unseed (function () {
      mongoose.connection.close (function () {
        return done ();
      })
    });
  });

  describe ('GET /oauth2/logout', function () {
    it ('should logout the current user', function (done) {
      request (app)
        .get ('/oauth2/logout')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (200, done);
    });

    it ('should not logout the user, already logged out', function (done) {
      request (app)
        .get ('/oauth2/logout')
        .set ('Authorization', 'Bearer ' + accessToken)
        .expect (401, done);
    });
  });
});
