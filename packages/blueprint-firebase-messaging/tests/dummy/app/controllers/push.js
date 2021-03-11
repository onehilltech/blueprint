const { Action, Controller, service } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({

  __invoke () {
    return Action.extend ({
      fcm: service (),

      execute (req, res) {
        const data = { message: 'Hello, World!' };

        this.fcm.send (req.user._id, { data }).catch (reason => console.log (reason));

        res.status (200).json (true);
      }
    });
  }
})