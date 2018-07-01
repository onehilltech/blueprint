const { Router } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification: {
    '{{route}}': {
      resource: {
        controller: '{{referenceName}}'
      }
    }
  }
});
