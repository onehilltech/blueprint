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

const blueprint = require ('@onehilltech/blueprint');
const {expect} = require ('chai');

describe.only ('app | services | gatekeeper', function () {
  function getService () {
    return blueprint.lookup ('service:gatekeeper');
  }

  describe ('init', function () {
    it ('should initialize the gatekeeper service', function () {
      let gatekeeper = getService ();

      expect (gatekeeper.tokenGenerator).to.have.deep.property ('options', {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer: 'gatekeeper',
        secret: 'ssshhh',
      });

      const generators = gatekeeper.tokenGenerators;

      expect (generators).to.have.keys (['gatekeeper:access_token', 'gatekeeper:account_verification', 'gatekeeper:password_reset']);

      expect (generators).to.have.property ('gatekeeper:access_token').to.have.deep.property ('options', {
        algorithm: 'HS256',
        expiresIn: '12 hours',
        subject: 'gatekeeper:access_token',
        issuer: 'gatekeeper',
        secret: 'ssshhh',
      });

      expect (generators).to.have.property ('gatekeeper:account_verification').to.have.deep.property ('options', {
        algorithm: 'HS256',
        expiresIn: '14 days',
        subject: 'gatekeeper:account_verification',
        issuer: 'gatekeeper',
        secret: 'ssshhh'
      });

      expect (generators).to.have.property ('gatekeeper:password_reset').to.have.deep.property ('options', {
        algorithm: 'HS256',
        expiresIn: '10 minutes',
        issuer: 'gatekeeper',
        subject: 'gatekeeper:password_reset',
        secret: 'ssshhh'
      });
    });
  });

  describe ('generateToken', function () {
    it ('should generate a token', function () {
      return getService ().generateToken ({message: 'Hello, World!'})
        .then (token => {
          expect (token).to.be.a ('string');
        });
    });
  });

  describe ('verifyToken', function () {
    it ('should verify a generated token', function () {
      const gatekeeper = getService ();
      return gatekeeper.generateToken ({message: 'Hello, World!'})
        .then (token => gatekeeper.verifyToken (token))
        .then (payload => {
          expect (payload).to.have.property ('message', 'Hello, World!');
        });
    });
  });
});
