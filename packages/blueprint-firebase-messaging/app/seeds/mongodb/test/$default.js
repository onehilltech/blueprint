'use strict';

const dab      = require ('@onehilltech/dab')
  , gatekeeper = require ('@onehilltech/gatekeeper')
  , ObjectId   = require ('mongoose').Types.ObjectId
  ;

module.exports = {
  native: [
    { name: 'client1', email: 'contact@client1.com', client_secret: 'client1', scope: [gatekeeper.scope.client.create] },
    { name: 'client2', email: 'contact@client2.com', client_secret: 'client2'},
    { name: 'client3', email: 'contact@client3.com', client_secret: 'client3', enabled: false }
  ],

  accounts: dab.times (5, function (i, opts, callback) {
    const whoami = 'account' + i;

    return callback (null, { username: whoami, password: whoami, email: 'contact@' + whoami + '.com'})
  }),

  user_tokens: dab.map (dab.get ('accounts'), function (account, opts, callback) {
    const model = {
      client: dab.get ('native.0'),
      account: account._id,
      refresh_token: new ObjectId (),
      scope: account.scope
    };

    return callback (null, model);
  }),

  cloud_tokens: [
    { device: new ObjectId (), owner: dab.ref ('accounts.0'), token: '123' },
    { device: new ObjectId (), owner: dab.ref ('accounts.0'), token: '456' },
    { device: new ObjectId (), owner: dab.ref ('accounts.0'), token: '789' },
    { device: new ObjectId (), owner: dab.ref ('accounts.0'), token: 'abc' },
    { device: new ObjectId (), owner: dab.ref ('accounts.0'), token: 'def' }
  ]
};
