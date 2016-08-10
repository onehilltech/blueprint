var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  baseuri : 'http://localhost:5000/gatekeeper',

  email : {
    from : 'noreply@onehilltech.com',
    twitterHandle: 'onehilltech',

    nodemailer : {
      transport: 'stub'
    }
  },

  token: {
    kind: 'jwt',
    options: {
      algorithm: 'RS256',
      publicKey:  blueprint.app.resource ('ssl/server.crt'),
      privateKey: blueprint.app.resource ('ssl/server.key'),
      issuer: 'engage'
    }
  }
};
