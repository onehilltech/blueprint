'use strict';

var util = require ('util')
  ;

module.exports = function (path) {
  return {
    isMongoId : {
      errorMessage: 'Invalid/missing ObjectID'
    }
  }
};
