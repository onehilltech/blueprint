const Action = require ('./action');

/**
 * @class LegacyFunctionAction
 *
 * Adapter that converts a legacy function(req, res) to an AbstractAction for
 * integration into Blueprint framework.
 */
module.exports = Action.extend ({
  execute (req, res) {
    return new Promise ((resolve, reject) => {
      let len = this.action.length;

      switch (len) {
        case 2: {
          // The action does not have a callback parameter.
          this.action (req, res);
          resolve (null);
          break;
        }

        case 3: {
          // The action has a callback parameter.
          this.action (req, res, (err) => {
            if (!err) return resolve (null);
            return reject (err);
          });

          break;
        }
      }
    });
  }
});
