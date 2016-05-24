var blueprint = require ('./blueprint')
  ;

var connected = false;

module.exports = exports = function (callback) {
  if (connected)
    return callback ();

  connected = true;
  blueprint.app.database.connect (callback);
};
