const Object = require ('./object');

module.exports = new Object ({
  name: process.env.NODE_ENV || 'development'
});
