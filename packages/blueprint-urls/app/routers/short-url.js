const { Router, policies: { check } } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '/short-urls': {
      policy: check ('gatekeeper.scope', 'blueprint.short-urls'),
      resource: {
        controller: 'short-url',
      }
    }
  }
});
