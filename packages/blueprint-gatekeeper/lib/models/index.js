exports.Account = require ('./account');
exports.oauth2  = require ('./oauth2');

exports.register = function (mongoose) {
  return {
    Account : require ('./account').register (mongoose),
    oauth2  : require ('./oauth2').register (mongoose)
  };
};