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
    validate: function (req, callback) {
      Policy.Definition (
        Policy.and ([
          Policy.assert ('passthrough', true),
          Policy.assert (function (req, callback) { return callback (null, true); })
        ])).evaluate (req, callback);
    },

    execute: function (req, res, callback) {
      res.render ('helloworld.pug', {name: req.body.name});
      return callback (null);
    }
  };
};

module.exports = exports = HelloWorldController;
