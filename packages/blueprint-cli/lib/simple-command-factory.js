const CommandFactory = require ('./command-factory');

/**
 * Utility function for creating a command factory.
 *
 * @param Command
 * @returns {(function(): *)|*}
 */
module.exports = function (Command) {
  const Factory = CommandFactory.extend ({
    makeCommand () {
      return new Command ();
    }
  });

  return function () {
    return new Factory ();
  }
}
