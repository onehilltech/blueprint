'use strict';

const async   = require ('async')
  , _         = require ('underscore')
  , mongoose  = require ('mongoose')
  , debug     = require ('debug')('blueprint:module:mongodb')
  , PopulateElement = require ('./PopulateElement')
  , PopulateArray   = require ('./PopulateArray')
  , Population      = require ('./Population')
;

function getKeyFromModel (model) {
  return model.db.name + ':' + model.modelName;
}

// Populate objects for each corresponding model.
var populators = {};

function createPopulatorImpl (Model, schema, callback) {
  const key = getKeyFromModel(Model);

  if (populators[key])
    return callback (null);

  debug ('creating populator for ' + key);

  var populate = {};
  var pending = [];

  async.eachOf (schema.paths, function (path, pathName, callback) {
    if (pathName === '__v')
      return callback (null);

    if (path.instance === 'ObjectID' && pathName !== '_id') {
      var ref = path.options.ref;
      var element = Model.db.models[ref];

      populate[pathName] = new PopulateElement (element);

      // Let's continue down the tree, and populate the fields of this
      // element. We want the result to be self-containing.
      pending.push ({element: element, schema: element.schema});
    }
    else if (path.instance === 'Array') {
      // We can either be populating references to documents, or sub-documents.
      var type = path.options.type[0];

      if (type instanceof mongoose.Schema) {

      }
      else {
        var arr = Model.db.models[type.ref];
        populate[pathName] = new PopulateArray (arr);

        // TODO Populate the fields in each element.
      }
    }

    return callback (null);
  }, complete);

  function complete (err) {
    if (err)
      return callback (err);

    populators[key] = populate;

    async.each (pending, function (value, callback) {
      createPopulatorImpl (value.element, value.schema, callback)
    }, callback);
  }
}

/**
 * Create the populator for a Model. The populator will contain the
 * paths for each field that is a candidate for populating.
 *
 * @param Model
 * @param schema
 * @returns {Function}
 */
function createPopulator (Model, schema) {
  return function (callback) {
    createPopulatorImpl (Model, schema, callback);
  }
}

module.exports = function (data, model, callback) {
  var key = getKeyFromModel (model);
  var tasks = [];

  if (!populators[key])
    tasks.push (createPopulator (model, model.schema));

  var population = new Population (populators);

  tasks.push (function (callback) {
    if (_.isArray (data))
      population.populateArray (key, data, callback);
    else
      population.populateElement (key, data, callback);
  });

  tasks.push (function (callback) {
    population.flatten (callback);
  });

  async.waterfall (tasks, callback);
};
