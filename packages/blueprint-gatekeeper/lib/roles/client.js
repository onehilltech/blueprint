var roles = {
  administrator: 'gatekeeper.administrator',

  account: {
    create: 'gatekeeper.account.create',
    update: 'gatekeeper.account.update',
    delete: 'gatekeeper.account.delete'
  },

  client: {
    create: 'gatekeeper.client.create',
    update: 'gatekeeper.client.update',
    delete: 'gatekeeper.client.delete'
  }
};

module.exports = exports = roles;