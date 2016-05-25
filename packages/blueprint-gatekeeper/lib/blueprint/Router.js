var blueprint  = require ('@onehilltech/blueprint')
  , cors       = require ('cors')
  , winston    = require ('winston')
  ;

var gatekeeper = require ('./../index')
  ;

const DEFAULT_VERSION = 1;

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

  winston.log ('info', 'checking origin: %s', origin);
  callback (null, true);
}

// First, configure cors support.
var corsConfig = blueprint.app.config.cors || {};
var options = corsConfig.options || {};

if (!options.origin)
  options.origin = origin;

module.exports = exports = function (opts) {
  opts = opts || {};

  // Select the router version.
  var version = 'v' + (opts.version || DEFAULT_VERSION);


  // Get the path for the router.
  var targetPath = opts.path || '/gatekeeper';
  var versionedRouter = gatekeeper.routers[version];

  var routerBuilder = new blueprint.RouterBuilder (targetPath);
  routerBuilder.addRouters (versionedRouter);

  return [cors (options)].concat (routerBuilder.getRouter ());
};

