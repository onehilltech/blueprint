var lib      = require ('../../../lib')
  , passport = require ('passport')
  ;

module.exports = exports = function (app) {
  var config = app.configs.gatekeeper;
  var tokenStrategy = lib.tokens (config.token);

  passport.use (lib.auth.bearer ({ tokenStrategy: tokenStrategy }));
};
