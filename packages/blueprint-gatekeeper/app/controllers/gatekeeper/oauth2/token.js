/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { checkSchema } = require('express-validator/check');

const {
  Controller,
  Action,
  BadRequestError,
  ForbiddenError,
  model,
  service,
  env,
  computed
} = require ('@onehilltech/blueprint');

const Granters = require ('../../../-internal/granters');
const ModelVisitor = require ('../../../models/-visitor');

const mm = require ('micromatch');

const { fromCallback } = require ('bluebird');
const { transform } = require ('lodash');
const { validationResult } = require ('express-validator/check');

/**
 * @class ValidateClientVisitor
 *
 * Visitor that validates the client portion of the token request.
 *
 * @private
 */
const ValidateClientVisitor = ModelVisitor.extend ({
  promise: null,

  req: null,

  recaptcha: service (),

  grantType: computed ({
    get () { return this.req.body.grant_type  }
  }),

  visitNativeClient (client) {
    // For a native client, we always need to authenticate the client secret.
    const {client_secret} = this.req.body;

    if (client.client_secret !== client_secret)
      this.promise = Promise.reject (new BadRequestError ('invalid_secret', 'The client secret is not valid.'));
  },

  visitHybridClient (client) {
    this.visitNativeClient (client);
  },

  visitAndroidClient (client) {
    // For an Android client, we need to authenticate the secret, and
    // make sure the package name matches the package of the client.
    this.visitNativeClient (client);

    if (!!this.promise)
      return;

    const packageName = this.req.body.package;

    if (packageName !== client.package)
      this.promise = Promise.reject (new BadRequestError ('invalid_package', 'The package does not match the client.'));
  },

  visitRecaptchaClient (client) {
    // The refresh token does not have recaptcha property.
    if (['refresh_token', 'temp'].includes (this.grantType))
      return;

    // For all reCAPTCHA clients requesting a token, the origin of the request
    // must match the origin of the client on record. This only applies when we
    // are not in the test environment.

    if (env !== 'test') {
      let origin = this.req.get ('origin');

      if (origin) {
        // The origin in the request is a string. The origin in the client model
        // can be a pattern. This will allow a single client model to handle requests
        // from different clients on the same domain.
        const isMatch = mm.isMatch (origin, client.origin);

        if (!isMatch)
          this.promise = Promise.reject (new BadRequestError ('invalid_origin', 'The origin of the request does not match the client.'));
      }
      else {
        this.promise = Promise.reject (new BadRequestError ('unknown_origin', 'The request is missing its origin.'));
      }
    }

    if (!!this.promise)
      return;


    // The request can from the correct client. Now, let's verify the response
    // with the server.
    const response = this.req.body.recaptcha;
    const ip = this.req.ip;
    const secret = client.recaptcha_secret;

    this.promise = this.recaptcha.verifyResponse (secret, response, ip);
  }
});

/**
 * @class TokenController
 *
 * The TokenController provides methods for binding OAuth 2.0 routes to its
 * implementation of the OAuth 2.0 protocol.
 *
 * @constructor
 */
module.exports = Controller.extend ({
  _tokenGenerator: null,
  _refreshTokenGenerator: null,

  /// Listing of the supported grant types.
  grantTypes: computed ({
    get () { return Object.keys (this.granters); }
  }),

  /// Collection of granters supported by the controller.
  granters: null,

  /// The gatekeeper service, which holds the different token generators.
  gatekeeper: service (),

  init () {
    this._super.call (this, ...arguments);

    this._tokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:access_token');
    this._refreshTokenGenerator = this.gatekeeper.getTokenGenerator ('gatekeeper:refresh_token');

    this.granters = transform (Granters, (results, Granter) => {
      let granter = new Granter ({app: this.app, tokenGenerator: this._tokenGenerator});
      results[granter.name] = granter;
    }, {});
  },

  /**
   * Issue an access token. The issue workflow depends on the grant_type
   * body parameter.
   */
  issueToken () {
    return Action.extend ({
      schema: {
        client_id: {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'The field is required.'
          },
          isMongoId: {
            errorMessage: 'The field is not valid.'
          }
        },

        grant_type: {
          in: 'body',
          isLength: {
            options: {min: 1},
            errorMessage: 'The field is required.'
          },
          isIn: {
            errorMessage: 'The grant type is not supported.',
            options: [this.grantTypes]
          }
        },
      },

      Client: model ('client'),

      validate (req) {
        // We also need to validate the request based on the client making the
        // request. For example, the native client will have different requirements
        // than the recaptcha client. So, let's locate the client in the database,
        // and all allow the granter to validate the request on per client basis.

        const {client_id} = req.body;

        return this.Client.findById (client_id).then (client => {
          if (!client)
            return Promise.reject (new BadRequestError ('unknown_client', 'The client does not exist.'));

          if (!client.enabled)
            return Promise.reject (new ForbiddenError ('client_disabled', 'The client is disabled.'));

          if (client.is_deleted)
            return Promise.reject (new BadRequestError ('client_deleted', 'The client has been deleted.'));

          req.gatekeeperClient = client;

          // Let's validate the schema for the granter. We consider this the
          // static validation for the granter.

          const granter = this.granterFor (req);
          const granterSchema = granter.schemaFor (client);

          let promises = [];

          if (granterSchema) {
            const checks = checkSchema (granterSchema);

            promises = checks.map (middleware => fromCallback (callback => {
              middleware.call (null, req, {}, callback);
            }));
          }

          return Promise.all (promises).then (() => {
            // We are checking the validation result now because we want to return
            // the proper error message if there were any validation errors related
            // to the schema definitions. If we do not put this check here, then we
            // run the risk of the dynamic validation generating a error that will
            // take priority over the schema validation errors.

            const errors = validationResult (req);

            if (!errors.isEmpty ())
              return;

            return Promise.resolve (this._validateClient (req, client))
              .then (() => granter.validate (req, client));
          });
        });
      },

      execute (req, res) {
        const granter = this.granterFor (req);

        return granter.createToken (req)
          .then (accessToken => accessToken.serialize (this.controller._tokenGenerator, this.controller._refreshTokenGenerator))
          .then (accessToken => {
            const ret = Object.assign ({token_type: 'Bearer'}, accessToken);
            res.status (200).json (ret);
          });
      },

      granterFor (req) {
        const {grant_type} = req.body;
        return this.controller.granters[grant_type];
      },

      _validateClient (req, client) {
        // The last part of the validation is performing any dynamic validation
        // based on the client. This validation is independent of the grant type
        // for the request. Afterwards, we are going to allow the granter to perform
        // any dynamic, context-specific validation.
        const v = new ValidateClientVisitor ({req});

        client.accept (v);

        return v.promise;
      }
    });
  },

  /**
   * Logout the current user making the request.
   *
   * @returns {*}
   */
  logout () {
    return Action.extend ({
      execute (req, res) {
        let { accessToken } = req;

        return accessToken.remove ().then (result => {
          if (!result)
            return Promise.reject (new BadRequestError ('invalid_token', 'The access token is invalid.'));

          // Notify all that we have an account logout.
          this.emit ('gatekeeper.session.logout', accessToken);

          res.status (200).send (true);
        });
      }
    });
  },

  /**
   * Verify an access token.
   *
   * This can be used to verify if a token was sent from the server when the public
   * key verification is not working on the client.
   */
  verify () {
    return Action.extend ({
      schema: {
        token: {
          in: 'body'
        }
      },

      /// Reference to the issuer service for token verification.
      gatekeeper: service (),

      /**
       * @override
       */
      async execute (req, res) {
        const { token, options } = req.body;

        try {
          await this.gatekeeper.verifyToken (token, options);
          return res.status (200).json ({ verified: true });
        }
        catch (reason) {
          return res.status (200).json ({ verified: false, reason });
        }
      }
    });
  }
});
