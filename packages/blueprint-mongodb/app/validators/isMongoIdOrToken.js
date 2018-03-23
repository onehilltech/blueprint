const {
  isMongoId
} = require ('validator') ;

module.exports = function (str, token) {
  return isMongoId (str) || str === token;
};

