const { Service } = require ('@onehilltech/blueprint');
const { spawn } = require ('child_process');
const { isArray } = require ('lodash');

const DEFAULT_PYTHON = 'python3';

/**
 * @class PythonService
 */
module.exports = Service.extend ({
  configure () {
    const { python = {} } = this.app.configs;
    const { command = DEFAULT_PYTHON } = python;

    // Define the python property here.
    Object.defineProperty (this, 'python', { value: command });
  },

  /**
   * Run a python script.
   *
   * @param args
   * @param options
   * @return {Promise<unknown>}
   */
  async run (args, options = {}) {
    const promise = new Promise ((accept, reject) => {
      if (!isArray (args))
        args = [args];

      const python = spawn (this.python, args, options);

      let stdout = '';
      let stderr = '';

      python.stdout.on ('data', (data) => {
        // This check allow us to stream to stdout to the caller in real-time. If caller
        // just has to set the stdout property on the returned promise to a function.

        const str = data.toString ();

        if (promise.stdout)
          promise.stdout (str);

        stdout += str
      });

      python.stderr.on ('data', (data) => {
        // This check allows us to stream to stderr to the caller in real-time. If caller
        // just has to set the stderr property on the returned promise to a function.

        const str = data.toString ();

        if (promise.stderr)
          promise.stderr (str);

        stderr += str;
      });

      // in close event we are sure that stream from child process is closed
      python.on ('close', (code) => {
        if (code === 0)
          accept (stdout);
        else
          reject ({code, message: stderr });
      });
    });

    return promise;
  }
});
