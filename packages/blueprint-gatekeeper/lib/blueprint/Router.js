var blueprint = require ('@onehilltech/blueprint')
  , cors      = require ('cors')
  , winston   = require ('winston')
  , path      = require ('path')
  , express   = require ('express')
  ;

const DEFAULT_VERSION = 1;

var router = express.Router ();

module.exports = exports = router;

/**
 * Check if the origin is whitelisted. By default, all origins are whitelisted
 * for this route.
 *
 * @param origin
 * @param callback
 */
function origin (origin, callback) {
  if (!origin)
    return callback (null, true);

  callback (null, true);
}

var modulePath = path.resolve (__dirname, '../../app');
var appModule = new blueprint.ApplicationModule (modulePath);

// Initialize the application module.

appModule.init (function (err, appModule) {
  if (err) throw err;

  var gatekeeperConfig = blueprint.app.configs.gatekeeper || {};
  var corsConfig = blueprint.app.configs.cors || {};
  var options = corsConfig.options || {};

  if (!options.origin)
    options.origin = origin;

  // Select the router version.
  var version = 'v' + (gatekeeperConfig.version || DEFAULT_VERSION);
  var routerSpec = appModule.routers[version];

  var routerBuilder = new blueprint.RouterBuilder ('/');
  routerBuilder.addRouters (routerSpec);

  var handlers = [cors (options)].concat (routerBuilder.getRouter ());
  router.use (handlers);
});
