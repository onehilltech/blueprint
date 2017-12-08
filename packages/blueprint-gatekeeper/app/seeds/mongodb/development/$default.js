const dab = require ('@onehilltech/dab');

module.exports = {
  native: [
    {
      _id: dab.id ('58ed90e1105aee00001e429f'),
      name: 'gatekeeper-android',
      client_secret: 'gatekeeper-android',
      email: 'james@onehilltech.com',
      scope: ['gatekeeper.account.create']
    }
  ],

  android: [
    {
      _id: dab.id ('593dc15c33812acb3a46ff30'),
      name: 'gatekeeper-android-demo',
      client_secret: 'gatekeeper-android-demo',
      email: 'james@onehilltech.com',
      package: 'com.onehilltech.gatekeeper.android.examples.standard',
      scope: ['gatekeeper.account.create']
    }
  ],

  recaptcha: [
    {
      _id: dab.id ('5a206991201dc8357e45d174'),
      name: 'gatekeeper-recaptcha',
      recaptcha_secret: '6LdcLDcUAAAAAL8U9Im2z-kebfr9M1oqL1lLS0C7',
      email: 'james@onehilltech.com',
      scope: ['gatekeeper.account.create']
    }
  ],

  accounts: [
    {
      _id: dab.id ('58ed92f64da0861f6aeb98cf'),
      email: 'tester@onehilltech.com',
      username: 'account1',
      password: 'account1',
      created_by: dab.ref ('android.0')
    }
  ]
};
