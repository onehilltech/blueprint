const FunctionDescriptor = require ('./function');

/**
 * @class UpdateDescriptor
 *
 * The descriptor for defining an updated function on an actor.
 */
class UpdateDescriptor extends FunctionDescriptor {
  constructor (input, output) {
    super (['update'], input, output);
  }
}

function update (input, output) {
  return new UpdateDescriptor (output, input);
}

module.exports = update;
