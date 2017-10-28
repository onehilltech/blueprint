'use strict';

let blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  baseUrl : 'http://localhost:5000/gatekeeper',
  activationRequired: true,

  email : {
    transport: {
      jsonTransport: true
    },

    views: {
      options: {
        extension: 'ejs'
      }
    },
    message: {
      from : 'no-reply@onehilltech.com',
    },
    locals: {
      twitterHandle: 'onehilltech'
    },
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
