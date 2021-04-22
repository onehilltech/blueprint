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

const { expect } = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const {BadRequestError} = blueprint;

const RECAPTCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

describe ('app | services | recaptcha', function () {
  describe ('verifyResponse', function () {
    this.timeout (5000);

    it ('should verify the response', function () {
      let recaptcha = blueprint.lookup ('service:recaptcha');

      return recaptcha.verifyResponse (RECAPTCHA_SECRET, 'random-response')
        .then (result => {
          expect (result).to.have.keys (['success','hostname','challenge_ts']);
          expect (result).to.have.property ('success', true);
          expect (result).to.have.property ('hostname', 'testkey.google.com');
          expect (result).to.have.property ('challenge_ts');
        })
    });

    it ('should failed because of bad secret', function () {
      let recaptcha = blueprint.lookup ('service:recaptcha');

      const expectedErrorCodes = ['invalid-input-secret'];

      return recaptcha.verifyResponse ('bad-secret', 'random-response')
        .then (result => expect.fail (result, {success: false, 'error-codes': expectedErrorCodes}, 'The verification should have failed.'))
        .catch (err => {
          expect (err).to.be.instanceof (BadRequestError);
          expect (err.code).to.equal ('recaptcha_failed');
          expect (err.message).to.equal ('Failed to verify the reCAPTCHA response.');
          expect (err.details).to.have.property ('error-codes').to.have.members (expectedErrorCodes);
        });
    });
  });
});
