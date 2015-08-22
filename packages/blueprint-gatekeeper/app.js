#!/usr/bin/env node
var winston = require ('winston');

require ('blueprint').app.start (function (err) {
  if (err)
    return winston.log ('error', err);

  winston.log ('info', 'application started...');
});
