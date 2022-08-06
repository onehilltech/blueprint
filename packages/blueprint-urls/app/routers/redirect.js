const { Router, policies: { check } } = require ('@onehilltech/blueprint');
const bodyParser = require ('body-parser');

module.exports = Router.extend ({
  specification: {
    '/*': {
      use: [bodyParser.json (), bodyParser.urlencoded ({extended: false})],
      get: 'redirect'
    }
  }
});
