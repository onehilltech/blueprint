var fs   = require ('fs')
  , path = require ('path')
  ;

module.exports = {
  token: {
    kind: 'jwt',
    options: {
      issuer: 'firebase-messaging',
      secret: 'ssshhh'
    }
  }
};
