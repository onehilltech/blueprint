#!/usr/bin/env node

var blueprint = require ('blueprint')
  , path      = require ('path')
  ;

var appPath = path.join (__dirname, 'app');
var app = blueprint.Application (appPath);

// Start the application.
app.start ();
