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

const assert    = require ('assert');
const { seed }  = require ('@onehilltech/blueprint-mongodb');
const { Test }  = require ('supertest');
const blueprint = require ('@onehilltech/blueprint');
const { Service } = blueprint;

/**
 * Add the authorization header to the request.
 *
 * @param name
 * @param value
 * @returns {*}
 */
Test.prototype.withAuthorization = function (value) {
  return this.set ('Authorization', value);
}

/**
 * Creates a Blueprint testing request that has already be initialized to a user.
 *
 * @param i       Index of user from dab file
 * @param conn    Name of database connection, or default if no name provided
 */
Test.prototype.withUserToken = function (i, conn) {
  const {user_tokens} = seed (conn);
  const gatekeeper = blueprint.lookup ('service:gatekeeper');
  const tokenGenerator = gatekeeper.getTokenGenerator ('gatekeeper:access_token');
  const refreshTokenGenerator = gatekeeper.getTokenGenerator ('gatekeeper:refresh_token');

  const accessToken = user_tokens[i].serializeSync (tokenGenerator, refreshTokenGenerator);

  assert (!!accessToken, `The seed for ${conn} does not have a user_tokens.[${i}]`);

  return this.withAuthorization ( `Bearer ${accessToken.access_token}`);
};

Test.prototype.fromUser = Test.prototype.withUserToken;

/**
 * Creates a Blueprint testing request that has already be initialized to a client.
 *
 * @param i     Index of client from dab file
 * @param conn    Name of database connection
 */
Test.prototype.withClientToken = function (i, conn) {
  const {client_tokens} = seed (conn);
  const gatekeeper = blueprint.lookup ('service:gatekeeper');
  const tokenGenerator = gatekeeper.getTokenGenerator ('gatekeeper:access_token');

  const accessToken = client_tokens[i].serializeSync (tokenGenerator);

  assert (!!accessToken, `The seed for ${conn} does not have a client_tokens.[${i}]`);

  return this.withAuthorization (`Bearer ${accessToken.access_token}`);
};

Test.prototype.fromClient = Test.prototype.withClientToken;

/**
 * Testing service for Gatekeeper
 */
module.exports = Service.extend ({

});

