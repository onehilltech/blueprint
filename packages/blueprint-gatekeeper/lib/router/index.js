var express = require ('express')
  , winston = require ('winston')
  , userpass = require ('./auth/userpass')
  , oauth2 = require ('./auth/oauth2')
  ;

module.exports = exports = function (opts) {
  opts = opts || {};
  var router = express.Router ();

  winston.info ('adding username/password support to router');
  router.use (userpass (opts));

  winston.info ('adding OAuth 2.0 support to router');
  router.use (oauth2 (opts));
   
  return router;
};
