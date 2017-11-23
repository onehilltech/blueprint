'use strict';

const async   = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

describe ('app | policies | gatekeeper | auth | bearer', function () {
  it ('should fail because of missing access token', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .expect (400, { errors: [{ status: '400', code: 'missing_token', detail: 'Missing access token' }]}, done);
  });

  it ('should fail because of invalid scheme', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bad Scheme')
      .expect (400, { errors: [{ status: '400', code: 'invalid_scheme', detail: 'Invalid authorization scheme' }] }, done);
  });

  it ('should fail because invalid authorization header', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer')
      .expect (400, { errors: [{ status: '400', code: 'invalid_authorization', detail: 'Invalid authorization header' }] }, done);
  });

  it ('should fail because of invalid token', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer bad-token')
      .expect (403, { errors: [{ status: '403', code: 'invalid_token', detail: 'jwt malformed' }] }, done);
  });

  it ('should fail because of unknown access token', function (done) {
    const userToken = blueprint.app.seeds.$default.user_tokens[0];
    const accessToken = userToken.serializeSync ();

    async.series ([
      function (callback) {
        userToken.remove (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: [{ status: '403', code: 'unknown_token', detail: 'Unknown access token' }] }, callback);
      }
    ], done);
  });

  it ('should fail because access token disabled', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .withUserToken (3)
      .expect (403, { errors: [{ status: '403', code: 'token_disabled', detail: 'Token is disabled' }] }, done);
  });

  it ('should fail because of unknown client', function (done) {
    const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
    const client = blueprint.app.seeds.$default.native[0];

    async.series ([
      function (callback) {
        client.remove (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: [{ status: '403', code: 'unknown_client', detail: 'Unknown client' }] }, callback);
      }
    ], done);
  });

  it ('should fail because client disabled', function (done) {
    const client = blueprint.app.seeds.$default.native[0];

    async.series ([
      function (callback) {
        client.enabled = false;
        client.save (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .withUserToken (0)
          .expect (403, { errors: [{ status: '403', code: 'client_disabled', detail: 'Client is disabled' }] }, callback);
      }
    ], done);
  });

  it ('should fail because of unknown account', function (done) {
    async.series ([
      function (callback) {
        const account = blueprint.app.seeds.$default.accounts[0];
        account.remove (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .withUserToken (0)
          .expect (403, { errors: [{ status: '403', code: 'unknown_account', detail: 'Unknown account' }] }, callback);
      }
    ], done);
  });

  it ('should fail because account is disabled', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .withUserToken (4)
      .expect (403, { errors: [{ status: '403', code: 'account_disabled', detail: 'Account is disabled' }] }, done);
  });
});