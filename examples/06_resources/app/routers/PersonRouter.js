module.exports = exports = {
  ':personId': { property: 'personId' },

  '/persons': {
    resource: {id: ':personId', controller: 'PersonController'}
  }
};