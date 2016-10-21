// build the Swagger UI specification

var path    = require ('path')
  , winston = require ('winston')
  , async   = require ('async')
  , express = require ('express')
  , swagger = require ('../../../lib/specification')
  ;

module.exports = initSwaggerUI;

const MODULE_NAME = '@onehilltech/blueprint-swagger';
const DEFAULT_UI_ENDPOINT = '/api-doc';
const DEFAULT_SPECIFICATION_ENDPOINT = '/swagger.json';

/**
 * Middleware function for returning the Swagger UI.
 *
 * @param app
 * @returns {Function}
 */
function getSwaggerUI (specUrl) {
  return function (req, res) {
    res.render ('swagger.handlebars', {specUrl: specUrl});
  }
}

/**
 * Middleware function for returning the Swagger specification.
 *
 * @param spec
 * @returns {Function}
 */
function getSwaggerSpec (spec) {
  return function (req, res) {
    return res.status (200).json (spec);
  };
}

/**
 * Initialize the Swagger UI definition for the application.
 *
 * @param app
 */
function initSwaggerUI (app) {
  winston.log ('info', 'building Swagger UI specification');
  var swaggerConfig = app.configs.swagger || {};

  async.waterfall ([
    // Build the specification from the application
    function (callback) {
      swagger (app, callback);
    },

    // Expose endpoints to the specification, and to the UI.
    function (spec, callback) {
      var server = app.server;

      if (server) {
        // Set the endpoint for viewing the Swagger UI.
        var uiEndpoint = swaggerConfig.uiEndpoint || DEFAULT_UI_ENDPOINT;

        if (uiEndpoint[0] !== '/')
          throw new Error ('UI endpoint must start with /');

        var specEndpoint = swaggerConfig.specEndpoint || DEFAULT_SPECIFICATION_ENDPOINT;

        if (specEndpoint[0] !== '/')
          throw new Error ('Specification endpoint must start with /');

        server.app.get (uiEndpoint, getSwaggerUI (specEndpoint));
        server.app.get (specEndpoint, getSwaggerSpec (spec));

        // Set the location of the static files rendered by the Swagger UI.
        var swaggerModule = app.modules[MODULE_NAME];
        var staticPath = path.resolve (swaggerModule.appPath, '../public_html');
        server.app.use (express.static (staticPath))
      }

      return callback (null);
    }
  ], done);

  function done (err) {
    if (err)
      winston.log ('error', 'Failed to initialize Swagger UI');
    else
      winston.log ('info', 'finished building Swagger UI specification');
  }
}
