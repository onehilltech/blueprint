'use strict';

var mongoose = require ('mongoose')
  , ObjectId = mongoose.Types.ObjectId
  ;

module.exports = function (str) {
  return ObjectId (str);
};
