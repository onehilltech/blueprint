var express  = require ('express'),
    router   = express.Router ();

var ROUTE_PREFIX = '/v1';

require ('./auth') (ROUTE_PREFIX, router);
require ('./oauth2') (ROUTE_PREFIX, router);

module.exports = exports = function (opts) {
  require ('./auth') (opts.prefix, router);
  require ('./auth') (opts.prefix, router);
};