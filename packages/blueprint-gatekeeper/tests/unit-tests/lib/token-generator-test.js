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

const TokenGenerator = require ('../../../lib/token-generator');
const {expect} = require ('chai');

describe ('lib | TokenGenerator', function () {
  function makeTokenGenerator () {
    return new TokenGenerator ({
      kind: 'jwt',
      options: {
        secret: 'ssshhh'
      }
    });
  }

  describe ('constructor', function () {
    it ('should create a new token generator', function () {
      let tg = makeTokenGenerator();
      expect (tg).to.be.instanceof (TokenGenerator);
    });
  });

  describe ('generateToken', function () {
    it ('should generate a token', function () {
      let tg = makeTokenGenerator ();

      return tg.generateToken ({admin: true})
        .then (token => {
          expect (token).to.be.a ('string');
          expect (token.split ('.')).to.have.length (3);
        });
    });
  });

  describe ('verifyToken', function () {
    it ('should verify the token', function () {
      let tg = makeTokenGenerator ();

      return tg.generateToken ({admin: true})
        .then (tg.verifyToken.bind (tg))
        .then (payload => {
          expect (payload.admin).to.be.true;
        });
    });
  });
});
