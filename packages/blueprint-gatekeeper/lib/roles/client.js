'use strict';

var roles = {
  administrator: 'gatekeeper.administrator',

  account: {
    create: 'gatekeeper.account.create',
    update: 'gatekeeper.account.update',
    delete: 'gatekeeper.account.delete'
  },

  client: {
    create: 'gatekeeper.client.create',
    get: 'gatekeeper.client.get',
    update: 'gatekeeper.client.update',
    delete: 'gatekeeper.client.delete'
  }
};

module.exports = roles;
