const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

module.exports = function (str, resolve) {
  let objectId = resolve (str);
  return !objectId ? new ObjectId (str) : objectId;
};
