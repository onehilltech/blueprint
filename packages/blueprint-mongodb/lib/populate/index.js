'use strict';

var PopulateElement = require ('./PopulateElement')
  ;

module.exports = function (model, opts) {
  var schema = model.schema;
  var populate = { };

  for (var key in schema.paths) {
    if (!schema.paths.hasOwnProperty (key) || key === '__v')
      continue;

    var path = schema.paths[key];

    if (path.instance === 'ObjectID' && key !== '_id') {
      var ref = path.options.ref;
      var Model = model.db.models[ref];

      populate[key] = {modelName: ref, populator: new PopulateElement (Model)};
    }
    else if (path.instance === 'Array')
      populate[key] = {modelName: path.options.type[0].ref};
  }

  return populate;
};
