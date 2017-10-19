'use strict';

let blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  baseUrl : 'http://localhost:5000/gatekeeper',
  activationRequired: true,

  email : {
    from : 'noreply@onehilltech.com',
    twitterHandle: 'onehilltech'
  },

  token: {
    kind: 'jwt',
    options: {
      algorithm: 'RS256',
      publicKey:  blueprint.app.resource ('ssl/server.crt'),
      privateKey: blueprint.app.resource ('ssl/server.key'),
      issuer: 'gatekeeper',
      expiresIn: '1h'
    }
  }
};
