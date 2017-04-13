'use strict';

const expect  = require ('chai').expect
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('@onehilltech/blueprint-mongodb')
  , winston   = require ('winston')
  , util      = require ('util')
  , _         = require ('underscore')
  , Account   = require ('../../../../../app/models/Account')
  ;

describe ('AccountRouter', function () {
  describe ('/v1/accounts', function () {
    describe ('GET', function () {
      it ('should return all the accounts for an admin', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[3].serializeSync ();

        Account.find ({}, function (err, accounts) {
          if (err)
            return done (err);

          blueprint.testing.request ()
            .get ('/v1/accounts')
            .query ({options: {sort: {username: 1}}})
            .set ('Authorization', 'Bearer ' + accessToken.access_token)
            .expect (200, {'accounts': mongodb.lean (blueprint.app.seeds.$default.accounts)}, done);
        });
      });

      it ('should not allow non-admin access to all accounts', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .get ('/v1/accounts')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
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
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        var account = null;

        // We know the account was created when we get an event for
        // sending an account activation email.
        blueprint.messaging.once ('gatekeeper.account.created', function (model) {
          account = model;
        });

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send ({account: data})
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200)
          .end (function (err, res) {
            if (err)
              return done (err);

            // Wait until the gatekeeper.account.created message is handled.
            blueprint.testing.waitFor (function () { return account !== null },
              function (err) {
                if (err) return done (err);
                expect (res.body).to.eql ({account: account.lean ()});

                return done (null);
              });
          });
      });

      it ('should create a new account, and login the user', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const autoLogin = {
          _id: mongodb.Types.ObjectId (),
          username: 'auto-login',
          password: 'auto-login',
          email: 'auto-login@onehilltech.com'
        };

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .query ({login: true})
          .send ({account: autoLogin})
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200)
          .end (function (err, res) {
            if (err)
              return done (err);

            var actual = mongodb.lean (_.omit (_.extend (autoLogin, {
              created_by: blueprint.app.seeds.$default.clients[0].id,
              scope: [],
              enabled: true
            }), ['password']));

            expect (res.body.account).to.eql (actual);
            expect (res.body).to.have.property ('token');

            expect (res.body.token).to.have.keys (['token_type', 'access_token', 'refresh_token']);
            expect (res.body.token).to.have.property ('token_type', 'Bearer');

            return done (null);
          });
      });

      it ('should not create an account [duplicate]', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const account = blueprint.app.seeds.$default.accounts[0];
        const dup = {username: account.username, password: account.password, email: account.email, created_by: account.created_by};

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send ({account: dup})
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (400, done);
      });

      it ('should not create an account [missing parameter]', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[0].serializeSync ();
        const invalid = {password: 'tester1', email: 'james@onehilltech.com'};

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send (invalid)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (400, done);
      });

      it ('should not create an account [invalid role]', function (done) {
        const accessToken = blueprint.app.seeds.$default.client_tokens[1].serializeSync ();
        const account = { username: 'tester1', password: 'tester1', email: 'james@onehilltech.com'};

        blueprint.testing.request ()
          .post ('/v1/accounts').send ({account: account})
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'policy_failed', message: 'No scopes defined' } }, done);
      });
    });
  });

  describe ('/v1/accounts/:accountId', function () {
    describe ('GET', function () {
      it ('should return the owner account', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should get my account', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should retrieve a user account for an admin', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[3].serializeSync ();

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should not allow non-admin access to another account', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
        var account = blueprint.app.seeds.$default.accounts[1];

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, done);
      });
    });

    describe ('UPDATE', function () {
      it ('should not update scope and created_by', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({account: {created_by: new mongodb.Types.ObjectId (), scope: ['the_new_scope']}})
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should update the email', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        var updated = account.lean ();
        updated.email = 'foo@contact.com';

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({account: {email: updated.email}} )
          .expect (200, {account: updated}, done);
      });

      it ('should allow admin to update the scope', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[3].serializeSync ();

        var updated = account.lean ();
        updated.scope.push ('the_new_scope');

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({account: {scope: updated.scope}})
          .expect (200, {account: updated}, done);
      });
    });

    describe ('/password', function () {
      it ('should change the password', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/accounts/' + account.id + '/password')
              .set ('Authorization', 'Bearer ' + accessToken.access_token)
              .send ({'change-password': { current: account.username, new: 'new-password'}})
              .expect (200, 'true')
              .end (callback);
          },

          function (callback) {
            async.waterfall ([
              function (callback) {
                Account.findById (account._id, callback);
              },

              function (changed, callback) {
                expect (changed.password).to.not.equal (account.password);
                return callback (null);
              }
            ], callback);
          }
        ], done);
      });

      it ('should not change the password because current is wrong', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

        blueprint.testing.request ()
          .post ('/v1/accounts/' + account.id + '/password')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .send ({'change-password': { current: 'bad-password', new: 'new-password'}})
          .expect (400, { errors: { code: 'invalid_password', message: 'Current password is invalid' } }, done);
      });
    });

    describe ('DELETE', function () {
      it ('should allow account owner to delete account', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .delete ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (200, 'true', done);
      });

      it ('should not allow user to delete account of another user', function (done) {
        const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
        const account = blueprint.app.seeds.$default.accounts[1];

        blueprint.testing.request ()
          .delete ('/v1/accounts/' + account.id)
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'policy_failed', message: 'Not the account owner' }}, done);
      });
    });
  });
});