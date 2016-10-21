// build the Swagger UI specification

var fse     = require ('fs-extra')
  , path    = require ('path')
  , winston = require ('winston')
  , async   = require ('async')
  , express = require ('express')
  ;

module.exports = initSwaggerUI;

// Support version of Swagger
const MODULE_NAME = '@onehilltech/blueprint-swagger';
const SWAGGER_VERSION = '2.0';
const DEFAULT_VERSION = '0.1.0';
const DEFAULT_ENDPOINT = '/api-doc';
const SUPPORTED_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

// Swagger definition for the application.
var swaggerSpec = {
  swagger: SWAGGER_VERSION,

  info: {

  }
};

function getSwaggerUI (app) {
  var appConfig = app.configs.app;
  var host = appConfig.host;

  return function (req, res) {
    res.render ('swagger.handlebars', {host: host});
  }
}

function getSwaggerSpec (app) {
  return function (req, res) {
    return res.status (200).json (swaggerSpec);
  };
}

/**
 * Define the InfoObject from the Swagger UI specification.
 *
 * @param packageObj
 * @param app
 */
function defineInfoObject (packageObj, app) {
  var appConfig = app.configs.app || {};
  var swaggerConfig = app.configs.swagger || {};
  var swaggerInfoConfig = swaggerConfig.info || {};

  // Define the info object in the Swagger specification.
  swaggerSpec.info.title = appConfig.name || packageObj.name;

  swaggerSpec.info.version = packageObj.version || DEFAULT_VERSION;
  swaggerSpec.info.description = packageObj.description;

  if (packageObj.license)
    swaggerSpec.info.license = {name: packageObj.license};

  if (packageObj.author)
    swaggerSpec.info.contact = packageObj.author;

  swaggerSpec.info.termsOfService = swaggerInfoConfig.termsOfService;
}

/**
 * Define the schemes property on the definition.
 * @param app
 */
function defineSchemes (app) {
  var serverConfig = app.configs.server || {};
  var protocols = serverConfig.protocols || {};
  var schemes = [];

  if (protocols.http)
    schemes.push ('http');

  if (protocols.https)
    schemes.push ('https');

  swaggerSpec.schemes = schemes;
}

function getMethods (methods) {
  var methodsSpec = {};

  for (var key in methods) {
    if (!methods.hasOwnProperty (key))
      continue;

    if (SUPPORTED_METHODS.indexOf (key) !== -1) {
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

function pushRouterSpec (basePath, routerSpec) {
  for (var key in routerSpec) {
    if (!routerSpec.hasOwnProperty (key))
      continue;

    var p = path.join (basePath, key);
    swaggerSpec.paths[p] = getMethods (routerSpec[key]);
  }
}

function pushRouters (basePath, routers) {
  for (var key in routers) {
    if (!routers.hasOwnProperty (key))
      continue;

    var router = routers[key];
    pushRouterSpec (basePath, router.spec);
  }
}

function definePaths (app) {
  // Start with an empty set of paths.
  swaggerSpec.paths = {};

  // Iterate over the routers adding each to the specification.
  pushRouters ('/', app.routerManager.resources);
}

/**
 * Initialize the Swagger UI definition for the application.
 *
 * @param app
 */
function initSwaggerUI (app) {
  winston.log ('info', 'building Swagger UI specification');

  function done (err) {
    if (err)
      winston.log ('error', 'Failed to initialize Swagger UI');
    else
      winston.log ('info', 'finished building Swagger UI specification');
  }

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
      defineInfoObject (packageObj, app);

      if (appConfig.host)
        swaggerSpec.host = appConfig.host;

      if (serverConfig.basePath)
        swaggerSpec.basePath = serverConfig.basePath;

      if (swaggerConfig.consumes)
        swaggerSpec.consumes = swaggerConfig.consumes;

      if (swaggerConfig.produces)
        swaggerSpec.produces = swaggerConfig.produces;

      defineSchemes (app);
      definePaths (app);

      return callback (null);
    },

    // Add a route the application server that returns the Swagger UI specification.
    function (callback) {
      var server = app.server;

      if (server) {
        // Set the endpoint for viewing the Swagger UI.
        var endpoint = swaggerConfig.endpoint || DEFAULT_ENDPOINT;
        server.app.get (endpoint, getSwaggerUI (app));
        server.app.get ('/swagger.json', getSwaggerSpec (app));

        // Set the location of the static files rendered by the Swagger UI.
        var swaggerModule = app.modules[MODULE_NAME];
        var staticPath = path.resolve (swaggerModule.appPath, '../public_html');
        server.app.use (express.static (staticPath))
      }

      return callback (null);
    }
  ], done);
}
