'use strict';

const dab      = require ('@onehilltech/dab')
  , gatekeeper = require ('@onehilltech/blueprint-gatekeeper')
  ;

module.exports = {
  native: [
    { name: 'client1', email: 'contact@client1.com', client_secret: 'client1', scope: [gatekeeper.scope.client.create] },
    { name: 'client2', email: 'contact@client2.com', client_secret: 'client2'},
    { name: 'client3', email: 'contact@client3.com', client_secret: 'client3', enabled: false }
  ],

  accounts: dab.times (5, function (i, opts, callback) {
    const username = 'account' + i;

    return callback (null, { username: username, password: username, email: `${username}@.no-reply.com`})
  }),

  client_tokens: dab.map (dab.get ('native'), function (client, opts, callback) {
    const model = { client: dab.get ('native.0'), account: client._id };
    return callback (null, model);
  }),

  user_tokens: dab.map (dab.get ('accounts'), function (account, opts, callback) {
    const model = {
      client: dab.get ('native.0'),
      account: account._id,
      refresh_token: dab.id ()
    };

    return callback (null, model);
  }),

  cloud_tokens: [
    { device: dab.id (), owner: dab.ref ('accounts.0'), token: '123' },
    { device: dab.id (), owner: dab.ref ('accounts.0'), token: '456' },
    { device: dab.id (), owner: dab.ref ('accounts.0'), token: '789' },
    { device: dab.id (), owner: dab.ref ('accounts.0'), token: 'abc' },
    { device: dab.id (), owner: dab.ref ('accounts.0'), token: 'def' }
  ]
};
