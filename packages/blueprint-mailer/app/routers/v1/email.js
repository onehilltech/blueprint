const { Router } = require ('@onehilltech/blueprint');
const bodyParser = require ('body-parser');

module.exports = Router.extend ({
  specification: {
    '/emails': {
      use: [bodyParser.json (), bodyParser.urlencoded ({extended: false})],

      resource: {
        controller: 'email'
      }
    }
  }
});
