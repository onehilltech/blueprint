var blueprint = require ('./lib')
  , path = require ('path')
  ;

blueprint.destroy ();
blueprint.Application (path.resolve (__dirname, './app'));

module.exports = exports = blueprint;
