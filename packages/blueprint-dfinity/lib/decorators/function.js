const decorator = require ('@onehilltech/decorator');
const { isArray } = require ('lodash');

function actorFunction (target, key, descriptor, params) {
  let [type, input, output] = params;

  if (!isArray (input)) {
    input = input !== undefined ? [input] : [];
  }

  if (!isArray (output)) {
    output = output !== undefined ? [output] : [];
  }

  // Let's delete the original initializer because we don't need it.
  delete descriptor.initializer;

  // Define this action on the actor. This will allow the actor to create an
  // instance of itself.
  const definition = [input, output, type];
  target.defineAction (key, definition);

  descriptor.enumerable = true
  descriptor.writable = false;
  descriptor.configurable = false;
  descriptor.value = definition;

  return descriptor;
}

module.exports = exports = decorator (actorFunction);

exports.decorator = function (type) {
  return decorator (function (target, key, descriptor, params) {
    return actorFunction (target, key, descriptor, [type, ...params]);
  });
};
