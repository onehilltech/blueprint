/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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

const { Secp256k1KeyIdentity } = require ('@dfinity/identity');
const fs = require ('fs');
const sha256 = require ('sha256');
const { fromCallback } = require ('bluebird');

/**
 * Load an identity from a private key.
 *
 * @param path
 * @return {Promise<Identity>}
 */
module.exports = async function identityFromFile (path) {
  const pem = await fromCallback (callback => fs.readFile (path, callback));

  const { buffer } = Uint8Array.from (pem);
  const privateKey = Uint8Array.from (sha256 (buffer, { asBytes: true }));

  return Secp256k1KeyIdentity.fromSecretKey (privateKey);
}