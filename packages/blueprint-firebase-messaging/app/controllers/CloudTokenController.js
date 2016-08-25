var blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.errors.HttpError
  ;

var CloudToken = require ('../models/CloudToken')
  ;

function CloudTokenController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (CloudTokenController);

/**
 * Register a token.
 *
 * @returns {{validate: validate, execute: execute}}
 */
CloudTokenController.prototype.registerToken = function () {
  const networks = ['gcm'];

  return {
    validate: function (req, callback) {
      req.checkBody ('network', 'Invalid network value').isIn (networks);
      req.checkBody ('token', 'Missing token parameter').notEmpty ();

      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var query   = {_id: req.user._id};
      var update  = {gcm: req.body.token};
      var options = {upsert: true};

      CloudToken.findOneAndUpdate (query, update, options, function (err) {
        if (err) return callback (new HttpError ('Failed to save token'));

        res.status (200).json (true);
        return callback ();
      });
    }
  }
};

module.exports = exports = CloudTokenController;
