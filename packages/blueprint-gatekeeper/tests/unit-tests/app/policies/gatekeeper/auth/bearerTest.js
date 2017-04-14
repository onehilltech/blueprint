'use strict';

const async   = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

describe ('policy:gatekeeper.auth.bearer', function () {
  it ('should have policy failure; missing access token', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .expect (400, { errors: { code: 'missing_token', message: 'Missing access token' } }, done);
  });

  it ('should have policy failure; invalid scheme', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bad Scheme')
      .expect (400, { errors: { code: 'invalid_scheme', message: 'Invalid authorization scheme' } }, done);
  });

  it ('should have policy failure; invalid authorization header', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer')
      .expect (400, { errors: { code: 'invalid_authorization', message: 'Invalid authorization header' } }, done);
  });

  it ('should have policy failure; invalid token', function (done) {
    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer bad-token')
      .expect (403, { errors: { code: 'invalid_token', message: 'jwt malformed' } }, done);
  });

  it ('should have policy failure; unknown access token', function (done) {
    const userToken = blueprint.app.seeds.$default.user_tokens[4];
    const accessToken = blueprint.app.seeds.$default.user_tokens[4].serializeSync ();

    async.series ([
      function (callback) {
        userToken.remove (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'unknown_token', message: 'Unknown access token' } }, callback);
      }
    ], done);
  });

  it ('should have policy failure; access token disabled', function (done) {
    const userToken = blueprint.app.seeds.$default.user_tokens[4];
    const accessToken = blueprint.app.seeds.$default.user_tokens[4].serializeSync ();

    async.series ([
      function (callback) {
        userToken.enabled = false;
        userToken.save (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'token_disabled', message: 'Token is disabled' } }, callback);
      }
    ], done);
  });

  it ('should have policy failure; unknown client', function (done) {
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
          .expect (403, { errors: { code: 'unknown_client', message: 'Unknown client' } }, callback);
      }
    ], done);
  });

  it ('should have policy failure; client disabled', function (done) {
    const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();
    const client = blueprint.app.seeds.$default.native[0];

    async.series ([
      function (callback) {
        client.enabled = false;
        client.save (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'client_disabled', message: 'Client is disabled' } }, callback);
      }
    ], done);
  });

  it ('should have policy failure; unknown account', function (done) {
    const account = blueprint.app.seeds.$default.accounts[0];
    const accessToken = blueprint.app.seeds.$default.user_tokens[0].serializeSync ();

    async.series ([
      function (callback) {
        account.remove (callback);
      },

      function (callback) {
        blueprint.testing.request ()
          .get ('/v1/accounts/me')
          .set ('Authorization', 'Bearer ' + accessToken.access_token)
          .expect (403, { errors: { code: 'unknown_account', message: 'Unknown account' } }, callback);
      }
    ], done);
  });

  it ('should have policy failure; account disabled', function (done) {
    const accessToken = blueprint.app.seeds.$default.user_tokens[4].serializeSync ();

    blueprint.testing.request ()
      .get ('/v1/accounts/me')
      .set ('Authorization', 'Bearer ' + accessToken.access_token)
      .expect (403, { errors: { code: 'account_disabled', message: 'Account is disabled' } }, done);
  });
});