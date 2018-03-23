const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

module.exports = function (str) {
  return ObjectId (str);
};
