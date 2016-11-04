'use strict';

var async = require ('async')
  , ConnectionManager = require ('../ConnectionManager')
  ;

module.exports = clearData;

function clearData (callback) {
  var connMgr = ConnectionManager.getConnectionManager ();
  var connections = connMgr.connections;

  async.each (connections, function (conn, callback) {
    async.each (conn.models, function (Model, callback) {
      Model.remove ({}, callback);
    }, callback);
  }, callback);
}
