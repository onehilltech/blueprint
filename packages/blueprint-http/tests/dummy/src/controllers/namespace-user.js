const UserController = require ('./user');

module.exports = class NamespaceUserController extends UserController {
  namespace = 'test';
}

