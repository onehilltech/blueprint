const ResourceController = require ('../../../../lib/resource-controller');
const User = require ('../models/user');

module.exports = ResourceController.extend ({
  model: User
});
