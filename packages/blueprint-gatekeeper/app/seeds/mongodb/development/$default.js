'use strict';

const dab      = require ('@onehilltech/dab')
  , gatekeeper = require ('../../../../lib')
  , ObjectId   = require ('@onehilltech/blueprint-mongodb').Types.ObjectId
;

module.exports = {
  native: [
    {
      _id: new ObjectId ('58ed90e1105aee00001e429f'),
      name: 'gatekeeper-android',
      client_secret: 'gatekeeper-android',
      email: 'james@onehilltech.com',
      scope: [gatekeeper.scope.account.create]
    }
  ],

  android: [
    {
      _id: new ObjectId ('593dc15c33812acb3a46ff30'),
      name: 'gatekeeper-android-demo',
      client_secret: 'gatekeeper-android-demo',
      email: 'james@onehilltech.com',
      package: 'com.onehilltech.gatekeeper.android.examples.standard',
      scope: [gatekeeper.scope.account.create]
    }
  ],

  accounts: [
    {
      _id: new ObjectId ('58ed92f64da0861f6aeb98cf'),
      email: 'tester@onehilltech.com',
      username: 'account1',
      password: 'account1',
      created_by: dab.ref ('android.0')
    }
  ]
};
