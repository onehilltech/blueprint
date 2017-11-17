const expect   = require ('chai').expect
  , async      = require ('async')
  , blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , _          = require ('underscore')
  , Account    = require ('../../../../../app/models/Account')
  ;

describe ('AccountRouter', function () {
  describe ('/v1/accounts', function () {
    describe ('GET', function () {
      it ('should return all the accounts for an admin', function (done) {
        blueprint.testing.request ()
          .get ('/v1/accounts')
          .query ({options: {sort: {username: 1}}})
          .fromUser (3)
          .expect (200, {'accounts': mongodb.lean (blueprint.app.seeds.$default.accounts)}, done);
      });

      it ('should not allow non-admin access to all accounts', function (done) {
        blueprint.testing.request ()
          .get ('/v1/accounts')
          .fromUser (0)
          .expect (403, done);
      });
    });

    describe ('POST', function () {
      let data = {
        username: 'tester1',
        password: 'tester1',
        email: 'james@onehilltech.com'
      };

      it ('should create a new account', function (done) {
        let account = null;

        // We know the account was created when we get an event for
        // sending an account activation email.
        blueprint.messaging.once ('gatekeeper.account.created', function (model) {
          account = model;
        });

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send ({account: data})
          .fromClient (0)
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
          .fromClient (0)
          .expect (200)
          .end (function (err, res) {
            if (err)
              return done (err);

            let actual = mongodb.lean (_.omit (_.extend (autoLogin, {
              created_by: blueprint.app.seeds.$default.native[0].id,
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
        const account = blueprint.app.seeds.$default.accounts[0];
        const dup = {username: account.username, password: account.password, email: account.email, created_by: account.created_by};

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send ({account: dup})
          .fromClient (0)
          .expect (400, done);
      });

      it ('should not create an account [missing parameter]', function (done) {
        const invalid = {password: 'tester1', email: 'james@onehilltech.com'};

        blueprint.testing.request ()
          .post ('/v1/accounts')
          .send (invalid)
          .fromClient (0)
          .expect (400, done);
      });

      it ('should not create an account [invalid role]', function (done) {
        const account = { username: 'tester1', password: 'tester1', email: 'james@onehilltech.com'};

        blueprint.testing.request ()
          .post ('/v1/accounts').send ({account: account})
          .fromClient (1)
          .expect (403, { errors: [{ status: '403', code: 'policy_failed', detail: 'Not a super user' }] }, done);
      });
    });
  });

  describe ('/v1/accounts/:accountId', function () {
    describe ('GET', function () {
      it ('should return the owner account', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .fromUser (0)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should get my account', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .fromUser (0)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should retrieve a user account for an admin', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .fromUser (3)
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should not allow non-admin access to another account', function (done) {
        let account = blueprint.app.seeds.$default.accounts[1];

        blueprint.testing.request ()
          .get ('/v1/accounts/' + account.id)
          .fromUser (0)
          .expect (403, done);
      });
    });

    describe ('UPDATE', function () {
      it ('should not update scope and created_by', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .fromUser (0)
          .send ({account: {created_by: new mongodb.Types.ObjectId (), scope: ['the_new_scope']}})
          .expect (200, {account: account.lean ()}, done);
      });

      it ('should update the email', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        let updated = account.lean ();
        updated.email = 'foo@contact.com';

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .fromUser (0)
          .send ({account: {email: updated.email}} )
          .expect (200, {account: updated}, done);
      });

      it ('should allow admin to update the scope', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        let updated = account.lean ();
        updated.scope.push ('the_new_scope');

        blueprint.testing.request ()
          .put ('/v1/accounts/' + account.id)
          .fromUser (3)
          .send ({account: {scope: updated.scope}})
          .expect (200, {account: updated}, done);
      });
    });

    describe ('/password', function () {
      it ('should change the password', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        async.series ([
          function (callback) {
            blueprint.testing.request ()
              .post ('/v1/accounts/' + account.id + '/password')
              .fromUser (0)
              .send ({password: { current: account.username, new: 'new-password'}})
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

        blueprint.testing.request ()
          .post ('/v1/accounts/' + account.id + '/password')
          .fromUser (0)
          .send ({password: { current: 'bad-password', new: 'new-password'}})
          .expect (400, { errors: [{ status: '400', code: 'invalid_password', detail: 'Current password is invalid' }] }, done);
      });
    });

    describe ('DELETE', function () {
      it ('should allow account owner to delete account', function (done) {
        const account = blueprint.app.seeds.$default.accounts[0];

        blueprint.testing.request ()
          .delete ('/v1/accounts/' + account.id)
          .fromUser (0)
          .expect (200, 'true', done);
      });

      it ('should not allow user to delete account of another user', function (done) {
        const account = blueprint.app.seeds.$default.accounts[1];

        blueprint.testing.request ()
          .delete ('/v1/accounts/' + account.id)
          .fromUser (0)
          .expect (403, { errors: [{ status: '403', code: 'policy_failed', detail: 'Not the account owner' }]}, done);
      });
    });
  });
});