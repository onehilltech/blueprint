var express = require ('express');
var login = require ('./auth');
var oauth2  = require ('./oauth2');

module.exports = exports = function (opts) {
  console.log (opts);

  opts = opts || {};
  var router = express.Router ();

  router.use (login (opts.auth);
  router.use (oauth2 (opts.oauth2));
   
  return router;
};
