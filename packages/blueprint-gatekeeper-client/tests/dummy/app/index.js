#!/usr/bin/env node

const blueprint = require ('@onehilltech/blueprint');

blueprint.createApplicationAndStart (__dirname)
  .then (() => console.log ('The application is started.'))
  .catch (err => console.error (err.message));