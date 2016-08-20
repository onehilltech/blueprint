module.exports = exports = {
  '/persons': {
    resource: { controller: 'PersonController' }
  },

  '/allow': {
    // only allow a subset of actions on the resource (whitelist)
    resource: {
      controller: 'PersonController',
      allow: ['create', 'getOne']
    }
  },

  '/deny': {
    // prevent a subset of the actions on the resource (blacklist)
    resource: {
      controller: 'PersonController',
      deny: ['delete']
    }
  }
};