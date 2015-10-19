var xpression = require ('xpression')
  , path      = require ('path')
  ;

// Export the application as a module. This allows other applications to integrate
// our application logic into their application logic.
var appPath = path.resolve (__dirname, '../app');
module.exports = exports = new xpression.ApplicationModule (appPath);

// Export the authentication package.
exports.auth = require ('./authentication');