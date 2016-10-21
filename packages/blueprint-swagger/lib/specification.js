'use strict';

var path    = require ('path')
  , winston = require ('winston')
  , async   = require ('async')
  , fse     = require ('fs-extra')
  ;

module.exports = buildSwaggerSpecification;

const SWAGGER_VERSION = '2.0';
const DEFAULT_VERSION = '0.1.0';
const SUPPORTED_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

/**
 * Build the Swagger specification.
 *
 * @param app
 * @param callback
 */
function buildSwaggerSpecification (app, callback) {
  var spec;
  var appConfig = app.configs.app || {};
  var serverConfig = app.configs.server || {};
  var swaggerConfig = app.configs.swagger || {};

  async.waterfall ([
    // Read the package file for the application.
    function (callback) {
      var packageFile = path.resolve (app.appPath, '../package.json');
      fse.readJson (packageFile, 'utf-8', callback);
    },

    // Build the definition.
    function (packageObj, callback) {
      spec = newSpec ();
      spec.info = defineInfoObject (packageObj);
      spec.schemes = defineSchemes ();
      spec.paths = definePaths ();

      return callback (null, spec);
    }
  ], callback);

  /**
   * Initialize the specification.
   */
  function newSpec () {
    var spec = { swagger: SWAGGER_VERSION };

    if (appConfig.host)
      spec.host = appConfig.host;

    if (serverConfig.basePath)
      spec.basePath = serverConfig.basePath;

    if (swaggerConfig.consumes)
      spec.consumes = swaggerConfig.consumes;

    if (swaggerConfig.produces)
      spec.produces = swaggerConfig.produces;

    return spec;
  }

  /**
   * Define the InfoObject from the Swagger UI specification.
   *
   * @param packageObj
   * @param app
   */
  function defineInfoObject (packageObj) {
    var swaggerInfoConfig = swaggerConfig.info || {};
    var info = {};

    // Define the info object in the Swagger specification.
    info.title = appConfig.name || packageObj.name;
    info.version = packageObj.version || DEFAULT_VERSION;
    info.description = packageObj.description;

    if (packageObj.license)
      info.license = {name: packageObj.license};

    if (packageObj.author)
      info.contact = packageObj.author;

    info.termsOfService = swaggerInfoConfig.termsOfService;

    return info;
  }


  /**
   * Define the schemes property on the definition.
   * @param app
   */
  function defineSchemes () {
    var protocols = serverConfig.protocols || {};
    var schemes = [];

    if (protocols.http)
      schemes.push ('http');

    if (protocols.https)
      schemes.push ('https');

    return schemes;
  }

  function definePaths () {
    // Start with an empty set of paths.
    var paths = {};

    // Iterate over the routers adding each to the specification.
    buildPathsFromRouters ('/', app.routerManager.resources);

    // Return the paths.
    return paths;

    function buildPathsFromRouters (basePath, routers) {
      for (var key in routers) {
        if (!routers.hasOwnProperty (key))
          continue;

        buildPathFromRouter (basePath, routers[key]);
      }
    }

    function buildPathFromRouter (basePath, router) {
      var spec = router.spec;

      for (var key in spec) {
        if (!spec.hasOwnProperty (key))
          continue;

        var p = path.join (basePath, key);
        paths[p] = getMethods (basePath, spec[key]);
      }
    }

    function getMethods (basePath, methods) {
      var methodsSpec = {};

      for (var key in methods) {
        if (!methods.hasOwnProperty (key))
          continue;

        if (key[0] === '/') {
          buildPathFromRouter (path.join (basePath, key), methods[key]);
        }
        else if (key === 'resource') {
          // Process a resource
        }
        else if (SUPPORTED_METHODS.indexOf (key) !== -1) {
          // Process a single method.
          var spec = {};
          var method = methods[key];

          methodsSpec[key] = {};

          if (method.tags)
            spec.tags = method.tags;

          if (method.summary)
            spec.summary = method.summary;

          if (method.description)
            spec.description = method.description;

          if (method.externalDocs)
            spec.externalDocs = method.externalDocs;

          if (method.operationId)
            spec.operationId = method.operationId;

          if (method.parameters)
            spec.parameters = method.parameters;

          if (method.consumes)
            spec.consumes = method.consumes;

          if (method.produces)
            spec.produces = method.produces;

          if (method.responses)
            spec.responses = method.responses;

          if (method.schemes)
            spec.schemes = method.schemes;

          if (method.deprecated)
            spec.deprecated = method.deprecated;

          if (method.security)
            spec.security = method.security;

          methodsSpec[key] = spec;
        }
      }

      return methodsSpec;
    }
  }
}
