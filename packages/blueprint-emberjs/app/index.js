#!/usr/bin/env node

const blueprint = require ('@onehilltech/blueprint');

return blueprint.createApplicationAndStart (__dirname)
  .catch (err => console.error (err));
