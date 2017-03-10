'use strict';

var validator = require ('validator')
  ;

module.exports = function (str, tokens) {
  return validator.isMongoId (str) || validator.isIn (str, tokens);
};

