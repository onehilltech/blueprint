var express = require ('express'),
    auth    = require ('./auth'),
    oauth2  = require ('./oauth2');

module.exports = exports = function (opts) {
  opts = opts || {};
  var router = express.Router ();

  router.use (auth (opts.auth));
  router.use (oauth2 (opts.oauth2));
   
  return router;
};
