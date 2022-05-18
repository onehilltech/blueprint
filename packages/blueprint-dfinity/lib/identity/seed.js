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
const hdkey = require ('hdkey');
const bip39 = require ('bip39');

/**
 * Load an identity from a seed phrase.
 *
 * @param phrase
 */
module.exports = async function identityFromSeed (phrase) {
  const seed = await bip39.mnemonicToSeed (phrase);
  const root = hdkey.fromMasterSeed (seed);
  const node = root.derive ("m/44'/223'/0'/0/0");

  return Secp256k1KeyIdentity.fromSecretKey (node.privateKey);
}