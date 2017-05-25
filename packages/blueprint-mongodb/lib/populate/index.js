'use strict';

const async   = require ('async')
  , pluralize = require ('pluralize')
  , _         = require ('underscore')
  , mongoose  = require ('mongoose')
  , PopulateElement = require ('./PopulateElement')
  , PopulateArray   = require ('./PopulateArray')
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

  var populate = {};

  async.eachOf (schema.paths, function (path, pathName, callback) {
    if (pathName === '__v')
      return callback (null);

    if (path.instance === 'ObjectID' && pathName !== '_id') {
      var ref = path.options.ref;
      var element = Model.db.models[ref];

      populate[pathName] = new PopulateElement (element);

      // Let's continue down the tree, and populate the fields of this
      // element. We want the result to be self-containing.
      return createPopulatorImpl (element, element.schema, callback);
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

    return callback (null);
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

function Population () {
  this._ids = {};
  this.population = {};
}

Population.prototype.flatten = function (callback) {
  async.mapValues (this.population, function (values, key, callback) {
    return callback (null, _.flatten (values));
  }, callback);
};

Population.prototype.populateElement = function (key, model, callback) {
  const populator = populators[key];
  this._populate (populator, model, callback);
};

Population.prototype.populateArray = function (key, arr, callback) {
  const populator = populators[key];

  // Iterate over each element in the array, and populate each one. The
  // partial result can be ignored since we are will be adding the populated
  // object directly to the result.
  async.each (arr, function (model, callback) {
    this._populate (populator, model, function (err, result) {
      return callback (err, result);
    });
  }.bind (this), callback);
};

Population.prototype._populate = function (populator, data, callback) {
  async.eachOf (populator, function (populate, path, callback) {
    const value  = data[path];

    if (!value)
      return callback (null);

    const plural = pluralize (populate.Model.modelName);

    // Make sure the result and ids for the current population exists. If not,
    // then we start with the default array.

    if (!this.population[plural])
      this.population[plural] = [];

    if (!this._ids[plural])
      this._ids[plural] = [];

    async.waterfall ([
      // Determine the ids that we need to search for.
      function (callback) {
        populate.accept ({
          visitPopulateElement: function () {
            const idStr = value.toString ();
            const coll = this._ids[plural];

            if (coll.indexOf (idStr) !== -1)
              return callback (null, null);

            coll.push (idStr);

            return callback (null, value);
          }.bind (this),

          visitPopulateArray: function () {
            const coll = this._ids[plural];

            async.filter (value, function (id, callback) {
              const idStr = id.toString ();
              const firstTime = coll.indexOf (idStr) === -1;

              if (firstTime)
                coll.push (idStr);

              return callback (null, firstTime);
            }, complete);

            function complete (err, result) {
              return callback (err, result.length > 0 ? result : null);
            }
          }.bind (this)
        })
      }.bind (this),

      // Populate populate the remaining ids.
      function (remaining, callback) {
        if (!remaining)
          return callback (null);

        populate.populate (remaining, function (err, model) {
          if (err)
            return callback (err);

          this.population[plural].push (model);

          return callback (null);
        }.bind (this));
      }.bind (this)
    ], callback);
  }.bind (this), callback);
};

module.exports = function (data, model, callback) {
  var key = getKeyFromModel (model);
  var tasks = [];

  if (!populators[key])
    tasks.push (createPopulator (model, model.schema));

  var population = new Population ();

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
