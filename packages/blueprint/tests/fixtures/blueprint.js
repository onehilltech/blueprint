var path = require ('path');
var blueprint = require ('../../lib');

blueprint.Application (path.resolve (__dirname, 'app'));
module.exports = exports = blueprint;
