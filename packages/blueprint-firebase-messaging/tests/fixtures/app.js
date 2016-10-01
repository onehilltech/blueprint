var path = require ('path')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var started = false;

module.exports = function (callback) {
  var appPath = path.resolve (__dirname, '../../app');
  blueprint.Application (appPath, function (err, app) {
    if (err)
      return callback (err);

    if (!started) {
      blueprint.messaging.emit ('app.start', app);
      started = true;
    }

    return callback (null, app);
  });
};
