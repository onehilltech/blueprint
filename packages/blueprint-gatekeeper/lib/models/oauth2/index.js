exports.AccessToken       = require ('./accessToken');
exports.AuthorizationCode = require ('./authorizationCode');
exports.Client            = require ('./client');

exports.register = function (mongoose) {
  return {
    AccessToken       : require ('./accessToken').register (mongoose),
    AuthorizationCode : require ('./authorizationCode').register (mongoose),
    Client            : require ('./client').register (mongoose)
  };
};