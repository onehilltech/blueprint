var express = require ('express'),
    auth    = require ('./auth'),
    oauth2  = require ('./oauth2');

module.exports = exports = function (opts) {
  console.log (opts);

  opts = opts || {};
  var router = express.Router ();

  console.log (opts);
  
  router.use (auth (opts.auth));
  router.use (oauth2 (opts.oauth2));
   
  return router;
};
