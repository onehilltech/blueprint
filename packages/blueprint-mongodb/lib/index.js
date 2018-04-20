const {
  model,
  modelOn,
  resource,
  resourceOn
} = require ('./models');

const {
  Types,
  Schema
} = require ('mongoose');


exports.Types = Types;
exports.Schema = Schema;
exports.plugins = require ('./plugins');

// model definitions
exports.model = model;
exports.modelOn = modelOn;
exports.resource = resource;
exports.resourceOn = resourceOn;

exports.ResourceController = require ('./resource-controller');
exports.GridFSController = require ('./gridfs-controller');
exports.populate = require ('./populate');
exports.lean = require ('./lean');
exports.seed = require ('./seed');
