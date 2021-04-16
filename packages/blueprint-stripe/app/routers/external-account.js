module.exports = {
  '/external-accounts': {
    resource: {
      controller: 'external-accounts',
      deny: ['getOne', 'count']
    }
  }
}