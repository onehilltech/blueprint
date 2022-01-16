const { Router } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '/emails': {
      resource: {
        controller: 'email'
      }
    }
  }
});
