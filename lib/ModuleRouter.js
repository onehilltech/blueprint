var Framework = require ('./Framework')
  , objectPath = require ('object-path')
  , util = require ('util')
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

  return objectPath.get (mod.routers, pathName);
};
