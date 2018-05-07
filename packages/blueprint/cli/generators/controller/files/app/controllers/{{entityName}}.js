const {
  Controller,
  Action
} = require ('@onehilltech/blueprint');

/**
 * @class {{entityBaseName}}
 */
module.exports = Controller.extend ({
{{#if defaultAction}}
  /**
   * This is the default controller action. It is bound from the router specification
   * if you do not provide a controller action with defining to the action property.
   *
   * @return {Action}       Action subclass
   */
  __invoke () {
    return Action.extend ({
      execute (req, res) {

      }
    });
  }
{{/if}}
});
