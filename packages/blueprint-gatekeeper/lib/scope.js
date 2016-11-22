'use strict';

var scope = {
  account: {
    create: 'gatekeeper.account.create',
    getall: 'gatekeeper.account.getall',
    update: 'gatekeeper.account.update',
    delete: 'gatekeeper.account.delete',
    count:  'gatekeeper.account.count'
  },

  client: {
    create: 'gatekeeper.client.create',
    getall: 'gatekeeper.client.getall',
    update: 'gatekeeper.client.update',
    delete: 'gatekeeper.client.delete',
    count:  'gatekeeper.client.count'
  }
};

var exports = module.exports = scope;

exports.superuser = '*';
