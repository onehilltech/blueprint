const { Router, policies: { check } } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '/redirect': {
      get: 'redirect'
    }
  }
});
