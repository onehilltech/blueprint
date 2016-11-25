'use strict';

const async   = require ('async')
  , util      = require ('util')
  , pluralize = require ('pluralize')
  , ConnectionManager = require ('../ConnectionManager')
  ;

module.exports = seed;

function seed (data, callback) {
  var conn = ConnectionManager.getConnectionManager ().defaultConnection;
  var models = {};

  async.eachOf (data, function (data, name, callback) {
    var singular = pluralize.singular (name);
    var Model = conn.models[singular];

    if (!Model)
      return callback (new Error (util.format ('model %s does not exist', singular)));

    Model.create (data, function (err, result) {
      if (err) return callback (err);

      models[name] = result;
      return callback (null);
    });
  }, complete);

  function complete (err) {
    return callback (err, models);
  }
}
