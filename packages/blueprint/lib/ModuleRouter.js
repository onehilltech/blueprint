var Framework = require ('./Framework')
  , RouterBuilder = require ('./RouterBuilder')
  , objectPath = require ('object-path')
  , util = require ('util')
  , _ = require ('underscore')
  ;

module.exports = exports = function (location) {
  var parts = location.split (':');

  if (parts.length !== 2)
    throw new Error ('Location must have format module:path');

  var moduleName = parts[0];
  var pathName = parts[1];
  
  var app = Framework ().app;
  var mod = app.modules[moduleName];

  if (!mod)
    throw new Error (util.format ('%s module does not exist', moduleName));

  var router = objectPath.get (mod.routers, pathName);

  if (!_.isFunction (router)) {
    // The pathname is a directory. This means we are loading many routers into
    // the mix. So, we need to actually build the router by adding routers to a
    // central router.
    router = new RouterBuilder (null, '/')
        .addRouters (router)
        .getRouter ();
  }

  return router;
};
