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

const { query, Actor } = require ('../lib');

/**
 * @class BasicBitcoinActor
 *
 * https://github.com/dfinity/examples/blob/master/motoko/basic_bitcoin/src/basic_bitcoin/basic_bitcoin.did
 */
module.exports = class BitcoinBasicActor extends Actor {
  /// Define the greet update method.
  @query ([], 'text')
  get_p2pkh_address;

  @query ('text', 'nat64')
  get_balance;

  @query ('text', {
    record: {
      utxos: 'vec utxo',
      tip_block_hash: 'blob',
      tip_height: 'nat32',
      next_page: 'opt blob'
    }
  })
  get_utxos;

  @query ([], 'vec nat64')
  get_current_fee_percentiles;

  @query ({
    record: {
      destination_address: 'text',
      amount_in_satoshi: 'nat64'
    }
  }, 'text')
  send;
};

