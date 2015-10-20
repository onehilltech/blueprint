var winston   = require ('winston')
  , xpression = require ('xpression')
  ;

function MeController () {

}

xpression.controller (MeController);

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
