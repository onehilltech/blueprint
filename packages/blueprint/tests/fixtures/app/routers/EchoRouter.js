module.exports = {
  '/echo': {
    resource: {controller: 'EchoResourceController'}
  },

  '/allow': {
    // only allow a subset of actions on the resource (whitelist)
    resource: {
      controller: 'EchoResourceController',
      allow: ['create', 'getOne']
    }
  },

  '/deny': {
    // prevent a subset of the actions on the resource (blacklist)
    resource: {
      controller: 'EchoResourceController',
      deny: ['delete']
    }
  },

  '/resource': {
    '/policies': {
      '/accepted': {
        resource: {
          controller: 'EchoResourceController',
          policy: 'alwaysTrue'
        }
      },

      '/rejected': {
        resource: {
          controller: 'EchoResourceController',
          policy: 'alwaysFalse'
        }
      }
    }
  }
};
