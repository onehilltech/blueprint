var fs   = require ('fs')
  , path = require ('path')
  ;

module.exports = {
  token: {
    kind: 'jwt',
    options: {
      issuer: 'blueprint-cloud-messaging',
      algorithm : 'RS256',
      secret: 'ssshhh'
    }
  }
};
