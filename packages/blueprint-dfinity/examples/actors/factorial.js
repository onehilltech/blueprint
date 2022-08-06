const { query, Actor } = require ('../lib');

/**
 * @class FactorialActor
 *
 * https://github.com/dfinity/examples/tree/master/motoko/factorial
 */
module.exports = Actor.extend ({
  /// Define the greet update method.
  fac: query ('nat', 'nat'),
});

