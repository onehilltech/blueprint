var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Account = require ('../models/Account')
  ;

function MeController () {

}

blueprint.controller (MeController);

/**
 * Get the user for the current user.
 *
 * @returns {Function}
 */
MeController.prototype.whoami = function () {
  return function whoami (req, res) {
    res.status (200).json ({_id : req.user.id});
  };
};

/**
 * Get my profile.
 */
MeController.prototype.getProfile = function () {
  return function getProfile (req, res) {
    var account = req.user;

    var profile = account.profile.toObject ();
    profile._id = account.id;

    res.status (200).json (profile);
  };
};

/**
 * Set the token for push notifications on the specified network.
 *
 * @param callback
 * @returns {Function}
 */
MeController.prototype.setPushNotificationToken = function (callback) {
  var self = this;

  return function (req, res) {
    var network = req.body.network;
    var token = req.body.token;

    // Update the network token
    var account = req.user;
    account.notifications[network] = token;

    account.save (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to save push notification token', callback);

      return res.status (200).json (true);
    });
  }
};

module.exports = exports = MeController;
