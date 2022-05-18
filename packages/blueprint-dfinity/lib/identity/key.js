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

module.exports = exports = {};

/**
 * Load the Identify from a private key.
 *
 * @param pem             The private key
 * @return {Secp256k1KeyIdentity}
 */
function fromKey (pem) {
  const { buffer } = Uint8Array.from (pem);
  const privateKey = Uint8Array.from (sha256 (buffer, { asBytes: true }));

  return Secp256k1KeyIdentity.fromSecretKey (privateKey);
}

/**
 * Load the Identity from a private key file.
 *
 * @param file            Private key file
 * @return {Promise<Secp256k1KeyIdentity>}
 */
async function fromKeyFile (file) {
  const pem = await fromCallback (callback => fs.readFile (file, callback));
  return fromKey (pem);
}

exports.fromKey = fromKey;
exports.fromKeyFile = fromKeyFile;
