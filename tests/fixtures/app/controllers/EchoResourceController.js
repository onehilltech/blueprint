var blueprint = require ('../../../../lib')
  , ResourceController = blueprint.ResourceController
  ;

function EchoResourceController () {
  ResourceController.call (this, {id: 'echoId'});
}

module.exports = EchoResourceController;

blueprint.controller (EchoResourceController, ResourceController);

function echo (msg) {
  return function () {
    return function (req, res) {
      res.json ({message: msg});
    }
  }
}

function echoWithId (msg, id) {
  return function () {
    return function (req, res) {
      res.json ({message: msg, id: req.params[id]});
    }
  }
}

EchoResourceController.prototype.create = echo ('create');
EchoResourceController.prototype.getAll = echo ('getAll');
EchoResourceController.prototype.get = echoWithId ('get', 'echoId');
EchoResourceController.prototype.update = echoWithId ('update', 'echoId');
EchoResourceController.prototype.delete = echoWithId ('delete', 'echoId');

// aggregation functions
EchoResourceController.prototype.count = echo ('count');
EchoResourceController.prototype.outdated = echoWithId ('outdated', 'echoId');
EchoResourceController.prototype.allOutdated = echo ('allOutdated');
