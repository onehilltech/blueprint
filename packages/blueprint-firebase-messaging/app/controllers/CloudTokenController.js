var blueprint = require ('@onehilltech/blueprint')
  , ResourceController = blueprint.ResourceController
  , HttpError = blueprint.errors.HttpError
  ;

var CloudToken = require ('../models/CloudToken')
  ;

function CloudTokenController () {
  ResourceController.call (this, {name: 'token', model: CloudToken});
}

blueprint.controller (CloudTokenController);

/**
 * Register a token.
 *
 * @returns {{validate: validate, execute: execute}}
 */
CloudTokenController.prototype.create = function () {
  return {
    validate: function (req, callback) {
      req.checkBody ('device', 'Missing device id').notEmpty ();
      req.checkBody ('token', 'Missing token parameter').notEmpty ();

      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var query = {
        'device': req.body.device
      };

      var update = {
        device: req.body.device,
        owner: req.user._id,
        token: req.body.token
      };

      var options = {
        upsert: true,
        new: true
      };

      CloudToken.findOneAndUpdate (query, update, options, function (err, token) {
        if (err) return callback (new HttpError (500, 'Failed to save token'));
        if (!token) return callback (new HttpError (400, 'Bad request'));

        res.status (200).json (true);

        return callback ();
      });
    }
  }
};

module.exports = exports = CloudTokenController;
