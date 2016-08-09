var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , cors      = require ('cors')
  , winston   = require ('winston')
  , path      = require ('path')
  , express   = require ('express')
  , util      = require ('util')
  ;

const DEFAULT_VERSION = 1;

function makeRouter (moduleName, version) {
  var router = express.Router ();
  version = 'v' + (version || DEFAULT_VERSION);

  var app = blueprint.app;

  function initRouter (app) {
    var corsConfig = app.configs.cors || {};
    var options = corsConfig.options || {};

    if (!options.origin)
      options.origin = origin;

    // Locate the Gatekeeper module in the application.
    var module = app.modules[moduleName];

    if (!module)
      throw Error (util.format ('Module [%s] does not exist', moduleName));

    // Select the router version.
    var routers = module.routers[version];
    var routerBuilder = new blueprint.RouterBuilder ('/');
    routerBuilder.addRouters (routers);

    var handlers = [cors (options)].concat (routerBuilder.getRouter ());
    router.use (handlers);

    messaging.emit ('gatekeeper.router.init', router);
  }

  if (app.is_init) {
    process.nextTick (function () {
      initRouter (app);
    })
  }
  else {
    messaging.once ('app.init', function (app) {
      initRouter (app);
    });
  }

  return router;
}

module.exports = exports = makeRouter;

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

