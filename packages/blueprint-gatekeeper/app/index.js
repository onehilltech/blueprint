#!/usr/bin/env node

var blueprint = require ('@onehilltech/blueprint')
  ;

blueprint.createApplicationAndStart (__dirname, function (err) {
  if (err)
    throw err;
});
