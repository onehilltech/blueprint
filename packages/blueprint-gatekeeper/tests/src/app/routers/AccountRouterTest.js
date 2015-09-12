var blueprint = require ('blueprint')
  , request   = require ('supertest')
  , expect    = require ('chai').expect
  ;

var datamodel = require ('../../../fixtures/datamodel')
  , Account    = blueprint.app.models.Account;
  ;

describe ('AccountController', function () {
  var server;

  before(function (done) {
    server = blueprint.app.server;
    blueprint.app.database.connect(done);
  });

  beforeEach(function (done) {
    datamodel.apply(done);
  });

  describe ('POST /accounts/:accountId/apn/token', function () {
    it ('should update the token', function (done) {
      request(server.app)
        .post ('/accounts/' + datamodel.models.accounts[0].id +  '/apn/token')
        .send ({network: 'gcm', token : '1234567890'})
        .expect ('true').expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          Account.findById (datamodel.models.accounts[0].id, function (err, account) {
            if (err) return done (err);

            expect (account.apn.gcm).to.equal ('1234567890');

            return done ();
          });
      });
    });
  });
});