const { SimpleCommandFactory, Command } = require ('../../../../../lib');

class MockCommand extends Command {
  constructor () {
    super ('mock', 'This is a mock command');
  }

  execute () {
    console.log ('Executing the mock command...');
  }
}

module.exports = SimpleCommandFactory (MockCommand);
