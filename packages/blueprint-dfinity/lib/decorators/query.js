const FunctionDescriptor = require ('./function');

/**
 * @class QueryDescriptor
 *
 * The descriptor for defining an updated function on an actor.
 */
class QueryDescriptor extends FunctionDescriptor {
  constructor (input, output) {
    super ([], input, output);
  }
}

function query (input, output) {
  return new QueryDescriptor (output, input);
}

module.exports = query;
