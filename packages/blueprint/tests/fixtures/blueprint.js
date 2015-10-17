var path = require ('path');
var blueprint = require ('../../lib');

var appPath = path.resolve (__dirname, 'app');
var app = blueprint.Application (appPath);

module.exports = exports = blueprint;

