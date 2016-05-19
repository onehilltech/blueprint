module.exports = exports = {
  ':personId': { property: 'personId' },

  '/persons': {
    resource: {
      id: ':personId',
      controller: 'PersonController'
    }
  },

  '/allow': {
    // only allow a subset of actions on the resource (whitelist)
    resource: {
      id: ':personId',
      controller: 'PersonController',
      allow: ['create', 'getOne']
    }
  },

  '/deny': {
    // prevent a subset of the actions on the resource (blacklist)
    resource: {
      id: ':personId',
      controller: 'PersonController',
      deny: ['delete']
    }
  }
};