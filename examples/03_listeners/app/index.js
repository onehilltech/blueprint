#!/usr/bin/env node

var winston   = require ('winston')
  , blueprint = require ('blueprint')
  ;

var app = new blueprint.Application (__dirname);
app.start (function (err) {
  if (err)
    return winston.log ('error', err);

  winston.log ('info', 'application started...');
});
