const { query, update, Actor } = require ('../lib');

/**
 * @class CalcActor
 *
 * https://github.com/dfinity/examples/blob/master/motoko/calc/src/Main.mo
 */
module.exports = Actor.extend ({
  add: update ('int', 'int'),
  sub: update ('int', 'int'),
  mul: update ('int', 'int'),
  div: update ('int', 'int'),
  clearall: update (),
});

