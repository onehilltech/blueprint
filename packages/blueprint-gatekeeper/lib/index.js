var blueprint = require ('blueprint')
  ;

// Export the application as a module. This allows other applications to integrate
// our application logic into their application logic.
module.exports = exports = new blueprint.ApplicationModule ('../app');

// Export the authentication package.
exports.auth = require ('./auth');