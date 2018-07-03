const { Router } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '{{ }}': {
      resource: {
        controller: '{{referenceName}}'
      }
    }
  }
});
