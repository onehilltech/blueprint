var express = require ('express')
  , winston = require ('winston')
  , path    = require ('path')
  , extend  = require ('extend')
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
  var middleware = app.middleware = {};

  // Configure the different middleware for the server. Some of the middleware
  // is required. Some of the middleware is optional. For the middleware that is
  // required, we provide default options if no options are provided. For the
  // middleware that is optional, it is only included in the server if options
  // are provided for it.

  var configurators = {
    morgan : function (app, opts) {
      winston.log ('debug', 'morgan format: %s', opts.format);
      middleware.morgan = require ('morgan');

      app.use (middleware.morgan (opts.format, opts.options));
    },

    cookies : function (app, opts) {
      winston.log('debug', 'cookie parser: %s', opts.cookies);
      middleware.cookies = require('cookie-parser');

      app.use (middleware.cookies (opts.cookies));
    },

    bodyParser : function (app, opts) {
      middleware.bodyParser = require('body-parser');

      for (key in opts) {
        if (opts.hasOwnProperty(key)) {
          var f = middleware.bodyParser[key];

          if (!f)
            throw new Error(util.format('%s is an unsupported middleware type', key));

          winston.log('debug', 'bodyParser.%s: %s', key, opts[key]);
          app.use (f.call (middleware.bodyParser, opts[key]));
        }
      }
    },

    validator : function (app, opts) {
      winston.log('debug', 'express validator: %s', opts);
      middleware.validator = require('express-validator');

      app.use (middleware.validator (opts));
    },

    session : function (app, opts) {
      winston.log('debug', 'express session: %s', opts);
      middleware.session = require('express-session');

      app.use (middleware.session (opts));
    },

    statics : function (app, opts) {
      // Initialize the static paths for the server.
      opts.forEach(function (staticPath) {
        staticPath = path.resolve(appPath, staticPath);
        winston.log ('debug', 'static path: ', staticPath);

        app.use(express.static(staticPath));
      });
    },
  };

  for (var key in config) {
    if (config.hasOwnProperty (key)) {
      // Locate the configurator for this configuration.
      var configurator = configurators[key];

      if (configurator)
        configurator (app, config[key])
    }
  }

  // Make sure that Passport is configured as the last middleware.
  if (config.passport) {
    var passport = middleware.passport = require ('passport');
    app.use (passport.initialize ());

    if (config.passport.session) {
      if (!config.session)
        throw new Error ('Session configuration is missing');

      // Configure the Express application to use passport sessions.
      app.use (passport.session ());

      // Configure Passport to serialize and deserialize user sessions.
      passport.serializeUser (config.passport.session.serializer);
      passport.deserializeUser (config.passport.session.deserializer);
    }
  }

  var viewsPath = path.resolve (appPath, DEFAULT_VIEWS_PATH);
  app.set ('views', viewsPath);
  app.set ('view engine', DEFAULT_VIEW_ENGINE);

  // Set the locals for the application.
  if (config.locals)
    extend (true, app.locals, config.locals);

  return app;
}

Object.defineProperty (exports, 'middleware', {
  get : function () { return middleware; }
});
