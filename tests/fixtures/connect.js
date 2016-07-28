var app = require ('./app')
  ;

var db = app.database;

module.exports = exports = function (callback) {
  if (db.state === 1 || db.state === 2)
    return callback ();

  blueprint.app.database.connect (callback);
};
