var blueprint = require ('@onehilltech/blueprint')
  , util      = require ('util')
  , Policy    = blueprint.Policy
  ;

function HelloWorldController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (HelloWorldController);

HelloWorldController.prototype.echoName = function () {
  return {
    validate: Policy (
      Policy.and ([
        Policy.assert (function (req, callback) {
          // Validate the request parameters.
        }),
        Policy.assert ('gatekeeper::is_admin'),
        Policy.assert (function (req, callback) { return callback (null, true); })
      ])
    ),

    execute: function (req, res, callback) {
      res.render ('helloworld', {name: req.body.name});
      return callback (null);
    }
  };
};

module.exports = exports = HelloWorldController;
