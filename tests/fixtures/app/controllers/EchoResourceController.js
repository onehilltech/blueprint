var blueprint = require ('../../../../lib')
  , ResourceController = blueprint.ResourceController
  ;

function EchoResourceController () {
  ResourceController.call (this, {
    name: 'echo',
    actions: {
      head: {verb: 'head', method: 'header'}
    }
  });
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

EchoResourceController.prototype.header = function () {
  return function (req, res) {
    res.header ('Method-Call', 'header');
    res.sendStatus (200);
  };
};

EchoResourceController.prototype.create = echo ('create');
EchoResourceController.prototype.getAll = echo ('getAll');
EchoResourceController.prototype.get = echoWithId ('get', 'echoId');
EchoResourceController.prototype.update = echoWithId ('update', 'echoId');
EchoResourceController.prototype.delete = echoWithId ('delete', 'echoId');

// aggregation functions
EchoResourceController.prototype.count = echo ('count');
