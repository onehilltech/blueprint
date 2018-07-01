const { Router } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '{{resourcePath}}': {
      resource: {
        controller: '{{referenceName}}'
      }
    }
  }
});
