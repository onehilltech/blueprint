var validators = require ('validator');

module.exports = function (str) {
  return validators.isMongodId (str) || str === 'me';
};

