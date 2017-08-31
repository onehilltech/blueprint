'use strict';

const async   = require ('async')
  , _         = require ('underscore')
  , mongoose  = require ('mongoose')
  , debug     = require ('debug')('blueprint:module:mongodb')
  , PopulateElement    = require ('./PopulateElement')
  , PopulateEmbedArray = require ('./PopulateEmbedArray')
  , PopulateArray      = require ('./PopulateArray')
  , Population         = require ('./Population')
;

function getKeyFromModel (model) {
  return model.db.name + ':' + model.modelName;
}

function Populators () {
  this.populators = {};
}

Populators.prototype.addModel = function (Model, callback) {
  const key = getKeyFromModel (Model);

  if (this.populators[key] !== undefined)
    return callback (null);

  // Put in a placeholder for the time being. This will prevent a model from
  // being processed multiple times.
  this.populators[key] = null;

  debug ('creating populator for ' + key);

  async.waterfall ([
    function (callback) {
      this._makePopulate (Model.db, Model.schema, callback);
    }.bind (this),

    function (populate, callback) {
      this.populators[key] = populate;

      return callback (null);
    }.bind (this)
  ], callback);
};

Populators.prototype._addSchema = function (db, schema, callback) {
  return callback (null);
};

Populators.prototype._makePopulate = function (db, schema, callback) {
  var populate = {};

  async.eachOf (schema.paths, function (path, pathName, callback) {
    if (pathName === '__v')
      return callback (null);

    if (path.instance === 'ObjectID' && pathName !== '_id') {
      const ref = path.options.ref;

      if (!ref)
        return callback (null);

      const elementModel = db.models[ref];

      populate[pathName] = new PopulateElement (elementModel);

      return this.addModel (elementModel, callback);
    }
    else if (path.instance === 'Array') {
      // We can either be populating references to documents, or sub-documents.
      var type = path.options.type[0];

      if (type instanceof mongoose.Schema) {
        // This path is for an embedded array of documents. We need to build
        // the populate map for the embedded array type. If there is at least
        // one field that can be populated, then we need to add this path to
        // the populate object.
        return async.waterfall ([
          function (callback) {
            this._makePopulate (db, type, callback);
          }.bind (this),

          function (result, callback) {
            if (Object.keys (result).length === 0)
              return callback (null);

            populate[pathName] = new PopulateEmbedArray (result);

            return callback (null);
          }
        ], callback);
      }
      else if (type.ref) {
        const arrModel = db.models[type.ref];
        populate[pathName] = new PopulateArray (arrModel);

        return this.addModel (arrModel, callback);
      }
    }

    return callback (null);
  }.bind (this), complete);

  function complete (err) {
    return callback (err, populate);
  }
};

var populators = new Populators ();

/**
 * Create the populator for a Model. The populator will contain the
 * paths for each field that is a candidate for populating.
 *
 * @param Model
 * @param schema
 * @returns {Function}
 */
function createPopulator (Model) {
  return function (callback) {
    populators.addModel (Model, callback);
  }
}

module.exports = function (data, model, callback) {
  var key = getKeyFromModel (model);
  var tasks = [];

  if (!populators[key])
    tasks.push (createPopulator (model));

  var population = new Population (populators.populators);
  population.addModels (model.modelName, data);

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
