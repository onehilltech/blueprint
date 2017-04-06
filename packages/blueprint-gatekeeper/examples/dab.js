const dab = require ('@onehilltech/blueprint-dab')
  ;

const scopes = [
  [gatekeeper.scope.account.create],
  [],
  []
];

const LOGIN_CLIENTS = {
  tester0: 0,
  tester1: 0,
  tester2: 1,
  tester3: 2
};

module.exports = {
  clients: dab.times (3, function (i, opts, callback) {
    var clientName = 'client' + i;
    var client = {name: clientName, secret: clientName, email: clientName + '@no-reply.com', scope: scopes[i]};

    return callback (null, client);
  }),

  accounts: dab.times (4, function (i, opts, callback) {
    var username = 'tester' + i;
    var account = {
      created_by: dab.ref ('clients.0'),
      username: username,
      password: username,
      email: username + '@no-reply.com'
    };

    return callback (null, account);
  }),

  user_tokens: dab.map (dab.get ('accounts'), function (account, opts, callback) {
    const clientIndex = LOGIN_CLIENTS[account.username];

    var model = {
      client: dab.get ('clients.' + clientIndex),
      account: account._id,
      refresh_token: new ObjectId (),
      scope: scopes[clientIndex]
    };

    return callback (null, model);
  }),

  client_tokens: dab.map (dab.get ('clients'), function (client, opts, callback) {
    return callback (null, {client: client._id});
  })
};

