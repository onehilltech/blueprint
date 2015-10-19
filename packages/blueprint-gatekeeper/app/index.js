#!/usr/bin/env node

var winston   = require ('winston')
  , xpression = require ('xpression')
  ;

xpression.Application (__dirname, function (app) {
  app.start (function (err) {
    if (err)
      return winston.log ('error', err);

    winston.log ('info', 'application started...');
  });
});

