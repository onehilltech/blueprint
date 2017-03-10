'use strict';

var validator = require ('validator')
  ;

module.exports = function (str, token) {
  return validator.isMongoId (str) || str === token;
};

