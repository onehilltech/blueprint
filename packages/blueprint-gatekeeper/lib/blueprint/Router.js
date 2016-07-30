var blueprint = require ('@onehilltech/blueprint')
  , cors      = require ('cors')
  , winston   = require ('winston')
  , path      = require ('path')
  ;

const DEFAULT_VERSION = 1;

var appPath = path.resolve (__dirname, '../../app');
var appModule = new blueprint.ApplicationModule (appPath);

appModule.init (function (err, appModule) {
  // Do nothing...
});

/**
 * Check if the origin is whitelisted. By default, all origins are whitelisted
 * for this route.
 *
 * @param origin
 * @param callback
 */
function origin (origin, callback) {
  if (!origin) return callback (null, true);
  callback (null, true);
}

module.exports = exports = function (opts) {
  var corsConfig = blueprint.app.configs.cors || {};
  var options = corsConfig.options || {};

  if (!options.origin)
    options.origin = origin;

  opts = opts || {};

  // Select the router version.
  var version = 'v' + (opts.version || DEFAULT_VERSION);

  // Get the path for the router.
  var targetPath = opts.path || '/gatekeeper';
  var versionedRouter = appModule.routers[version];

  var routerBuilder = new blueprint.RouterBuilder (targetPath);
  routerBuilder.addRouters (versionedRouter);

  return [cors (options)].concat (routerBuilder.getRouter ());
};

