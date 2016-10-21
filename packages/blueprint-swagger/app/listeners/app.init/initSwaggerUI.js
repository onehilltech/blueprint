// build the Swagger UI specification

var fse     = require ('fs-extra')
  , path    = require ('path')
  , winston = require ('winston')
  , async   = require ('async')
  , express = require ('express')
  ;

module.exports = initSwaggerUI;

// Support version of Swagger
const SWAGGER_VERSION = '2.0';
const DEFAULT_VERSION = '0.1.0';
const DEFAULT_ENDPOINT = '/api-doc';

// Swagger definition for the application.
var spec = {
  swagger: SWAGGER_VERSION,

  info: {

  }
};

function getSwaggerUI (req, res) {
  res.render ('swagger', {spec: spec});
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
  spec.info.title = appConfig.name || packageObj.name;

  spec.info.version = packageObj.version || DEFAULT_VERSION;
  spec.info.description = packageObj.description;

  if (packageObj.license)
    spec.info.license = {name: packageObj.license};

  if (packageObj.author)
    spec.info.contact = packageObj.author;

  spec.info.termsOfService = swaggerInfoConfig.termsOfService;
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

  spec.schemes = schemes;
}

function definePaths (app) {
  spec.paths = {};
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
        spec.host = appConfig.host;

      if (serverConfig.basePath)
        spec.basePath = serverConfig.basePath;

      if (swaggerConfig.consumes)
        spec.consumes = swaggerConfig.consumes;

      if (swaggerConfig.produces)
        spec.produces = swaggerConfig.produces;

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
        server.app.get (endpoint, getSwaggerUI);

        // Set the location of the static files rendered by the Swagger UI.
        var staticPath = path.resolve (app.appPath, '../public_html');
        server.app.use (express.static (staticPath))
      }

      return callback (null);
    }
  ], done);
}
