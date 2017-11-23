'use strict';

const dab      = require ('@onehilltech/dab')
  , gatekeeper = require ('../../../../lib')
  , ObjectId   = require ('@onehilltech/blueprint-mongodb').Types.ObjectId
  ;


module.exports = {
  native: [
    {
      name: 'client1',
      email: 'client1@gatekeeper.com',
      client_secret: 'client1'
    },
    {
      name: 'client2',
      email: 'client2@gatekeeper.com',
      client_secret: 'client2'
    },
    {
      name: 'client3',
      email: 'client3@gatekeeper.com',
      client_secret: 'client3',
      enabled: false
    }
  ],

  accounts: [
    {
      email: 'hilljh82@gmail.com',
      username: 'account1',
      password: 'account1',
      created_by: dab.ref ('native.0')
    },
    {
      email: 'account2@gatekeeper.com',
      username: 'account2',
      password: 'account2',
      created_by: dab.ref ('native.0')
    },
    {
      email: 'account3@gatekeeper.com',
      username: 'account3',
      password: 'account3',
      created_by: dab.ref ('native.0')
    },
    {
      email: 'account4@gatekeeper.com',
      username: 'account4',
      password: 'account4',
      created_by: dab.ref ('native.0'),
      scope: []
    },
    {
      email: 'account5@gatekeeper.com',
      username: 'account5',
      password: 'account5',
      created_by: dab.ref ('native.0'),
      enabled: false
    }
  ],

  user_tokens: [
    { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['gatekeeper.account.*'] },
    { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['gatekeeper.account.get_all'] },
    { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), scope: ['dummy'] },
    { client: dab.ref ('native.0'), account: dab.ref ('accounts.0'), enabled: false },
    { client: dab.ref ('native.0'), account: dab.ref ('accounts.4')}
  ],

  client_tokens: [
    { client: dab.ref ('native.0'), scope: ['gatekeeper.account.create']},
    { client: dab.ref ('native.0'), scope: ['dummy']}
  ]
};
