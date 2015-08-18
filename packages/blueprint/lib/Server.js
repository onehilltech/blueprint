var express = require ('express')
  , winston = require ('winston')
  , path    = require ('path')
  ;

const DEFAULT_VIEWS_PATH = 'views';
const DEFAULT_VIEW_ENGINE = 'jade';

/**
 * Factory method for making a new Express server.
 */
module.exports = exports = function (appPath, config) {
  // Store the options, and make sure the default options are set.
  config = config || { };
  if (!config.morgan)
    config.morgan = { format : 'combined' };

  // Make a new express application.
  var app = express ();

  // Configure the different middleware for the server. Some of the middleware
  // is required. Some of the middleware is optional. For the middleware that is
  // required, we provide default options if no options are provided. For the
  // middleware that is optional, it is only included in the server if options
  // are provided for it.

  var configurators = {
    morgan : function (app, opts) {
      winston.log ('debug', 'morgan format: %s', opts.format);
      app.use (require ('morgan')(opts.format, opts.options));
    },

    cookies : function (app, opts) {
      winston.log('debug', 'cookie parser: %s', opts.cookies);
      app.use(require('cookie-parser')(opts.cookies));
    },

    bodyParser : function (app, opts) {
      var bodyParser = require('body-parser');

      for (key in opts) {
        if (opts.hasOwnProperty(key)) {
          var f = bodyParser[key];

          if (!f)
            throw new Error(util.format('%s is an unsupported middleware type', key));

          winston.log('debug', 'bodyParser.%s: %s', key, opts[key]);
          app.use(f.call(bodyParser, opts[key]));
        }
      }
    },

    validator : function (app, opts) {
      winston.log('debug', 'express validator: %s', opts);
      app.use(require('express-validator')(opts));
    },

    session : function (app, opts) {
      winston.log('debug', 'express session: %s', opts);
      app.use(require('express-session')(opts));
    },

    statics : function (app, opts) {
      // Initialize the static paths for the server.
      opts.forEach(function (staticPath) {
        staticPath = path.resolve(appPath, staticPath);
        winston.log ('debug', 'static path: ', staticPath);

        app.use(express.static(staticPath));
      });
    }
  };

  for (var key in config) {
    if (config.hasOwnProperty (key)) {
      // Locate the configurator for this configuration.
      var configurator = configurators[key];

      if (configurator)
        configurator (app, config[key])
    }
  }

  var viewsPath = path.resolve (appPath, DEFAULT_VIEWS_PATH);
  app.set ('views', viewsPath);
  app.set ('view engine', DEFAULT_VIEW_ENGINE);

  return app;
}
