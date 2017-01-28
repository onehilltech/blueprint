'use strict';

var blueprint = require ('../../../../lib')
  , errors    = blueprint.errors
  ;

function BaseController () {
  blueprint.BaseController.call (this);
}

module.exports = BaseController;

blueprint.controller (BaseController);

BaseController.prototype.testCheckSchemaThen = function () {
  function test (req, callback) {
    return callback (null);
  }

  return {
    validate: this.checkSchemaThen ({
      'email': {
        in: 'body',
        notEmpty: true,
        isEmail: {
          errorMessage: 'Invalid Email'
        }
      }
    }, test),

    execute: function (req, res) {
      res.status (200).json ({email: req.body.email})
    }
  }
};
