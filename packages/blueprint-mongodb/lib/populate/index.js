'use strict';

const async   = require ('async')
  , pluralize = require ('pluralize')
  , _         = require ('underscore')
  , PopulateElement = require ('./PopulateElement')
  , PopulateArray   = require ('./PopulateArray')
  ;

function getKeyFromModel (model) {
  return model.db.name + ':' + model.modelName;
}

// Populate objects for each corresponding model.
var populators = {};

function createPopulator (Model) {
  return function (callback) {
    var populate = {};

    async.eachOf (Model.schema.paths, function (path, pathName, callback) {
      if (pathName === '__v') return callback (null);

      if (path.instance === 'ObjectID' && pathName !== '_id') {
        var ref = path.options.ref;
        var model = Model.db.models[ref];

        populate[pathName] = new PopulateElement (model);
      }
      else if (path.instance === 'Array') {
        var ref = path.options.type[0].ref;
        var model = Model.db.models[ref];

        populate[pathName] = new PopulateArray (model);
      }

      return callback (null);
    }, complete);

    function complete (err) {
      if (err) return callback (err);

      var key = getKeyFromModel(Model);
      populators[key] = populate;

      return callback (null);
    }
  }
}

function populateImpl (populator, data, ids, result, callback) {
  async.eachOf (populator, function (populate, path, callback) {
    const value  = data[path];
    const plural = pluralize (populate.Model.modelName);

    // Make sure the result and ids for the current population exists. If not,
    // then we start with the default array.

    if (!result[plural])
      result[plural] = [];

    if (!ids[plural])
      ids[plural] = [];

    async.waterfall ([
      // Determine the ids that we need to search for.
      function (callback) {
        populate.accept ({
          visitPopulateElement: function () {
            var coll = ids[plural];
            var idStr = value.toString ();

            if (coll.indexOf (idStr) !== -1)
              return callback (null, null);

            coll.push (idStr);
            return callback (null, value);
          },

          visitPopulateArray: function () {
            var coll = ids[plural];

            async.filter (value, function (id, callback) {
              var idStr = id.toString ();
              var firstTime = coll.indexOf (idStr) === -1;

              if (firstTime)
                coll.push (idStr);

              return callback (null, firstTime);
            }, complete);

            function complete (err, result) {
              return callback (err, result.length > 0 ? result : null);
            }
          }
        })
      },

      // Populate populate the remaining ids.
      function (remaining, callback) {
        if (!remaining) return callback (null);

        populate.populate (remaining, function (err, model) {
          if (err) return callback (err);
          result[plural].push (model);

          return callback (null);
        });
      }
    ], callback);
  }, complete);

  function complete (err) {
    return callback (err, result);
  }
}

function populateArray (key, arr) {
  var ids = {};
  var result = {};

  return function (callback) {
    const populator = populators[key];

    // Iterate over each element in the array, and populate each one. The
    // partial result can be ignored since we are will be adding the populated
    // object directly to the result.
    async.each (arr, function (model, callback) {
      populateImpl (populator, model, ids, result, function (err, partial) {
        return callback (err, result);
      });
    }, complete);

    function complete (err) {
      if (err) return callback (err);

      async.mapValues (result, function (values, name, callback) {
        return callback (null, _.flatten (values));
      }, callback);
    }
  };
}

function populateOne (key, model) {
  var ids = {};

  return function (callback) {
    const populator = populators[key];

    populateImpl (populator, model, ids, {}, function (err, result) {
      if (err) return callback (err);

      async.mapValues (result, function (values, name, callback) {
        return callback (null, _.flatten (values));
      }, callback);
    });
  }
}

module.exports = function (data, model, callback) {
  var key = getKeyFromModel (model);
  var tasks = [];

  if (!populators[key])
    tasks.push (createPopulator (model));

  if (_.isArray (data))
    tasks.push (populateArray (key, data));
  else
    tasks.push (populateOne (key, data));

  async.series (tasks, complete);

  function complete (err, results) {
    if (err) return callback (err);

    var ret = results[tasks.length - 1];
    return callback (null, ret);
  }
};
