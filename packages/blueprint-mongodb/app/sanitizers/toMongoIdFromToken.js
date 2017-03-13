'use strict';

var mongoose = require ('mongoose')
  , ObjectId = mongoose.Types.ObjectId
  ;

module.exports = function (str, resolve) {
  var objectId = resolve (str);

  if (!objectId)
    return objectId = new ObjectId (str);

  return objectId;
};
