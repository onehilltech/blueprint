const Object = require ('./object');

module.exports = Object.extend ({
  name: process.env.NODE_ENV || 'development'
});
