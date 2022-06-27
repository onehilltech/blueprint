const { isObjectLike } = require ('lodash');

module.exports = function (obj) {
  return encodeURI (JSON.stringify (obj));
};
