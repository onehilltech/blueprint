var express = require ('express')
  , winston = require ('winston')
  , userpass = require ('./userpass')
  , oauth2 = require ('./oauth2')
  ;

module.exports = exports = function (opts) {
  opts = opts || {};
  var router = express.Router ();

  winston.info ('adding username/password support to router');
  router.use (userpass (opts.userpass));

  winston.info ('adding OAuth 2.0 support to router');
  router.use (oauth2 (opts.oauth2));
   
  return router;
};
