const { SimpleCommandFactory, Command } = require ('@onehilltech/blueprint-cli');

class DeployCommand extends Command {
  constructor () {
    super ('name', 'deploy a Blueprint application');
  }
}

module.exports = SimpleCommandFactory (DeployCommand);