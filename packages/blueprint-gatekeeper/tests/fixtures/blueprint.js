var blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  ;

blueprint.Application (path.resolve (__dirname, '../../app'));
module.exports = exports = blueprint;
