const { query, Actor } = require ('../lib');

/**
 * @class QuicksortActor
 *
 * https://github.com/dfinity/examples/tree/master/motoko/quicksort
 */
module.exports = Actor.extend ({
  /// Define the greet update method.
  sort: query ('vec int', 'vec int'),
});

