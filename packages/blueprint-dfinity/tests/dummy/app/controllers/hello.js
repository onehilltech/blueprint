const { Controller, Action } = require ('@onehilltech/blueprint');
const { actor } = require ('../../../../lib');

module.exports = Controller.extend ({
  /**
   * The default action for the controller.
   */
  __invoke () {
    return Action.extend ({
      /// Reference to the hello Internet Computer actor.
      hello: actor ('hello'),

      // helloExplicit: actor ('hello', { agent: '$default', canisterId: '$default' }),

      /**
       * Execute the action for this route.
       *
       * @param req         The request object
       * @param res         The response object
       */
      async execute (req, res) {
        const { name } = req.body;
        const message = await this.hello.greet (name);

        return res.status (200).json ( { message });
      }
    });
  }
})