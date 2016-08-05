var fs = require ('fs')
  , path = require ('path')
  ;

module.exports = exports = {
  activation: {
    required: true
  },

  token: {
    kind: 'jwt',
    options: {
      issuer: 'gatekeeper',
      algorithm: 'RS256',
      publicKey: fs.readFileSync (path.resolve (__dirname, '../../resources/ssl/server.crt')),
      privateKey: fs.readFileSync (path.resolve (__dirname, '../../resources/ssl/server.key'))
    }
  }
};
