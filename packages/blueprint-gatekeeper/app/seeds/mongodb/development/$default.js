'use strict';

const dab      = require ('@onehilltech/dab')
  , gatekeeper = require ('../../../../lib')
  , ObjectId   = require ('@onehilltech/blueprint-mongodb').Types.ObjectId
;

module.exports = {
  clients: [
    {
      _id: new ObjectId ('58ed90e1105aee00001e429f'),
      name: 'gatekeeper-android',
      secret: 'gatekeeper-android',
      email: 'james@onehilltech.com',
      scope: [gatekeeper.scope.account.create]
    }
  ],

  accounts: [
    {
      _id: new ObjectId ('58ed92f64da0861f6aeb98cf'),
      email: 'tester@onehilltech.com',
      username: 'account1',
      password: 'account1',
      created_by: dab.ref ('clients.0')
    }
  ]
};
