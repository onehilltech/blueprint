const { Router } = require ('@onehilltech/blueprint');

module.exports = Router.extend ({
  specification () {
    return {
      '/swagger.json': {
        get: 'swagger@json'
      }
    }
  }
})