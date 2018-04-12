const BlueprintObject = require ('./object');

module.exports = new BlueprintObject ({
  env: process.env.NODE_ENV || 'development'
});
