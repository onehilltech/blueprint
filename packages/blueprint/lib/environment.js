const Object = require ('./object');

module.exports = new Object ({
  env: process.env.NODE_ENV || 'development'
});
