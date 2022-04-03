const { Router, policies: { check } } = require ('@onehilltech/blueprint');
const bodyParser = require ('body-parser');

module.exports = Router.extend ({
  specification: {
    '/short-urls': {
      use: [bodyParser.json (), bodyParser.urlencoded ({extended: false})],

      policy: check ('gatekeeper.scope', 'blueprint.short-urls'),
      resource: {
        controller: 'short-url',
      }
    }
  }
});
