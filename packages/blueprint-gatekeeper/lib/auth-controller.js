const { Controller } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  /**
   * The action for authenticating a user.
   *
   * @returns {Promise<unknown[]>|boolean|TokenGenerator|void}
   */
  authenticate () {
    return Action.extend ({
      execute (req, res) {
        return Promise.resolve (this.authenticate (req))
          .then (user => Promise.all ([
            this.prepareTokenOptions (req, user),
            this.prepareTokenPayload (req, user)
          ]))
          .then (([options, payload]) => {

          });
      },

      authenticate (req) {
        return true;
      },

      prepareTokenOptions (req, user) {

      },

      prepareTokenPayload (req, user) {

      }
    })
  }
});