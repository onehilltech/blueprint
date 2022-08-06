const { query, Actor } = require ('../lib');

/**
 * @class BasicBitcoinActor
 *
 * https://github.com/dfinity/examples/blob/master/motoko/basic_bitcoin/src/basic_bitcoin/basic_bitcoin.did
 */
module.exports = Actor.extend ({
  /// Define the greet update method.
  get_p2pkh_address: query ([], 'text'),

  get_balance: query ('text', 'nat64'),

  get_utxos: query ('text', {
    record: {
      utxos: 'vec utxo',
      tip_block_hash: 'blob',
      tip_height: 'nat32',
      next_page: 'opt blob'
    }
  }),

  get_current_fee_percentiles: query ([], 'vec nat64'),

  send: query ({
    record: {
      destination_address: 'text',
      amount_in_satoshi: 'nat64'
    }
  }, 'text'),
});

