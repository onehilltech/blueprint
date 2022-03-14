const { PropertyDescriptor } = require ('@onehilltech/blueprint');
const { isArray } = require ('lodash');

/**
 * @class FunctionDescriptor
 *
 * The base class for function descriptors.
 */
class FunctionDescriptor extends PropertyDescriptor {
  /**
   * Construct the function descriptor.
   *
   * @param type            The function type
   * @param input           The input values
   * @param output          The output values
   */
  constructor (type, input, output) {
    super ();

    this._type = type;
    this._input = input ? (isArray (input) ? input : [input]) : [];
    this._output = output ? (isArray (output) ? output : [output]) : [];
  }

  /**
   * @override
   */
  defineProperty (actor, name) {
    // Define this action on the actor. This will allow the actor to create an
    // instance of itself.
    actor.defineAction (name, this.definition);

    // The property definition is the signature the IDL.Func expects for this action.
    Object.defineProperty (actor, name, {
      enumerable: true,
      configurable: false,
      writable: false,
      value: this.definition
    });
  }

  /// Get the function idl definition.
  get definition () {
    return [this._input, this._output, this._type];
  }

  /// The function type.
  _type;

  /// The input values for the function.
  _input;

  /// The output values for the function.
  _output;
}

module.exports = FunctionDescriptor;
