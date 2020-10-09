const commander = require ('commander');
const { BaseObject } = require ('base-object');

/**
 * @class Command
 *
 * The base class for all command objects in the cli framework.
 */
class Command extends commander.Command {
  /**
   * Constructor
   *
   * @param name            Name of the command
   * @param description     Description of the command
   */
  constructor (name, description) {
    super (name);

    // Configure the underlying
    this.description (description);
    this.action (this.execute.bind (this));
  }

  /**
   * Method called with the command is to execute.
   *
   * @param command
   */
  execute (command) {
    throw new Error ('The command must overload the execute() method');
  }
}

module.exports = Command;
