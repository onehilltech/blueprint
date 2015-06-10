var AccessToken = require ('../models/oauth2/accessToken');

function Oauth2Controller (opts) {
  this._opts = opts || {};
}

Oauth2Controller.prototype.logoutUser = function (tokenId, done) {
  AccessToken.findByIdAndRemove (tokenId, done);
}

exports = module.exports = Oauth2Controller;