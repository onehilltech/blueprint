var express      = require ('express'),
    bodyParser   = require ('body-parser'),
    mongoose     = require ('mongoose'),
    passport     = require ('passport'),
    morgan       = require ('morgan'),
    config       = require ('./app-config');

// Create the application, and set the default configuration.
var app = express ();
app.use (morgan (config.morgan));
app.use (bodyParser (config.bodyParser));
app.use (passport.initialize ());

module.exports = exports = app;
