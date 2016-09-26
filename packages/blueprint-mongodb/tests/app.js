var blueprint = require ('@onehilltech/blueprint')
  , path = require ('path')
  ;

var appPath = path.resolve (__dirname, '../app');

module.exports = function (callback) {
  blueprint.Application (appPath, callback);
};
