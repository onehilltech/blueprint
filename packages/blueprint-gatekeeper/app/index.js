#!/usr/bin/env node

var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  ;

blueprint.Application (__dirname, function (app) {
  app.start (function (err) {
    if (err)
      return winston.log ('error', err);

    winston.log ('info', 'application started...');
  });
});

