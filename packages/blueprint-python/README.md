blueprint-python
========================

Run Python scripts from a Blueprint application

Installation
--------------

    npm install @onehilltech/blueprint-python --save

Getting Started
----------------

### Running a Python script

You run a Python script by first injecting the `python` service into a Blueprint component,
such as a controller, action, service, policy, etc. After injecting the service, call the
`run (args, options)` method on the service. This is an asynchronous method. The return 
value is the standard output (_i.e._, stdout) of the script.

```javascript
const { Action, Controller, service } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  __invoke () {
    return Action.extend ({
      /// Inject the Python service into the action.
      python: service (),
      
      async execute (req, res) {
        const result = await this.python.run (script);
        
        return res.status (200, { result } );
      }
    });
  }
});
```

### Passing arguments to the Python script

You can pass arguments to the python script by passing an array as the first
parameter of the `run (args, options)` method.

```javascript
const { Action, Controller, service } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  __invoke () {
    return Action.extend ({
      /// Inject the Python service into the action.
      python: service (),
      
      async execute (req, res) {
        const result = await this.python.run ([script, arg1, arg2]);
        
        return res.status (200, { result } );
      }
    });
  }
});
```

### Passing options to the execution process

The last parameter of `run (args, options)` are options for configuring the execution
process that runs the Python script. The options supported as the same as the options
from [`process.spawn`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options).
This allows you to configure the working directory of the script, set environment variables
for the script's process, or detach the script.

Happy Coding!
