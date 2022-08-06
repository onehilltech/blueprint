const { query, update, Actor } = require ('../lib');

/**
 * @class QuicksortActor
 *
 * https://github.com/dfinity/examples/tree/master/motoko/quicksort
 */
module.exports = Actor.extend ({
  installer: query (undefined, 'principal'),
  argument: query (undefined, 'principal'),
  whoami: update (undefined, 'principal'),
  id: update (undefined, 'principal'),
  idQuick: update (undefined, 'principal')
});

