var path = require ('path')
  , async = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = function (callback) {
  var appPath = path.resolve (__dirname, '../../app');

  var app = blueprint.Application (appPath, function (err, app) {
    if (err) return callback (err);

    var db = app.database;

    if (db.state === 1 || db.state === 2)
      return callback (null, app);

    db.connect (function (err) {
      return callback (err, app);
    });
  });
};
