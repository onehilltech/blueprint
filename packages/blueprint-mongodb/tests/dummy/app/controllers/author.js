const ResourceController = require ('../../../../lib/resource-controller');
const Author = require ('../models/author');

module.exports = ResourceController.extend ({
  model: Author
});
