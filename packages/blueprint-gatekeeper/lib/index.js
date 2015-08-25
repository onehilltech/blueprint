var blueprint = require ('blueprint')
  , path      = require ('path')
  ;

// Export the application as a module. This allows other applications to integrate
// our application logic into their application logic.
var appPath = path.resolve (__dirname, '../app');
module.exports = exports = new blueprint.ApplicationModule (appPath);

// Export the authentication package.
exports.auth = require ('./authentication');