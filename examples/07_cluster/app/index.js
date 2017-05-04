#!/usr/bin/env node

var blueprint = require ('@onehilltech/blueprint')
  , winston   = require ('winston')
;

blueprint.createApplicationAndStart (__dirname, function (err) {
  if (err)
    winston.log ('error', err);

  winston.log ('info', 'application started...');
});
