// build the Swagger UI specification

var fse     = require ('fs-extra')
  , path    = require ('path')
  , winston = require ('winston')
  , async   = require ('async')
  ;

module.exports = initSwaggerUI;

// Support version of Swagger
const SWAGGER_VERSION = '2.0';
const DEFAULT_VERSION = '0.1.0';
const DEFAULT_ENDPOINT = '/swagger';

// Swagger definition for the application.
var swagger = {
  swagger: SWAGGER_VERSION,

  info: {

  }
};

function getSwaggerDefinition (req, res) {

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
  swagger.info.title = appConfig.name || packageObj.name;

  swagger.info.version = packageObj.version || DEFAULT_VERSION;
  swagger.info.description = packageObj.description;

  if (packageObj.license)
    swagger.info.license = {name: packageObj.license};

  if (packageObj.author)
    swagger.info.contact = packageObj.author;

  swagger.info.termsOfService = swaggerInfoConfig.termsOfService;
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

  swagger.schemes = schemes;
}

function definePaths (app) {
  swagger.paths = {};
}

/**
 * Initialize the Swagger UI definition for the application.
 *
 * @param app
 */
function initSwaggerUI (app) {
  function done (err) {
    if (err)
      winston.log ('error', 'Failed to initialize Swagger UI')
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
        swagger.host = appConfig.host;

      if (serverConfig.basePath)
        swagger.basePath = serverConfig.basePath;

      if (swaggerConfig.consumes)
        swagger.consumes = swaggerConfig.consumes;

      if (swaggerConfig.produces)
        swagger.produces = swaggerConfig.produces;

      defineSchemes (app);
      definePaths (app);

      return callback (null);
    },

    // Add a route the application server that returns the Swagger UI specification.
    function (callback) {
      var endpoint = swaggerConfig.endpoint || DEFAULT_ENDPOINT;
      var server = app.server;

      if (server)
        server.app.get (endpoint, getSwaggerDefinition);

      return callback (null);
    }
  ], done);
}
