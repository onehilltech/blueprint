const { BaseObject } = require ('base-object');

/**
 * @class CommandFactory
 *
 * The base class for concrete command factories. The command factory is responsible
 * for creating concrete commands.
 */
const CommandFactory = BaseObject.extend ({
  makeCommand () {
    throw new Error ('You must overload the makeCommand() method.');
  },

  /// Optional options for the command.
  options: null
});

module.exports = CommandFactory;

CommandFactory.SimpleCommandFactory = function (Command) {
  const Factory = CommandFactory.extend ({
    makeCommand () {
      return new Command ();
    }
  });

  return function () {
    return new Factory ();
  }
}
