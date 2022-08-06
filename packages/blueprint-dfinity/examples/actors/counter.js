const { query, update, Actor } = require ('../lib');

/**
 * @class BasicBitcoinActor
 *
 * https://github.com/dfinity/examples/blob/master/motoko/counter/src/Main.mo
 */
module.exports = Actor.extend ({
  get: query ([], 'nat'),
  set: update ('nat', []),
  inc: update ([], []),
});

