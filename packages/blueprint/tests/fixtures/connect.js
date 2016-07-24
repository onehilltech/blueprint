var blueprint = require ('./lib')
  ;

var connected = false;

module.exports = exports = function (callback) {
  if (connected)
    return callback ();

  connected = true;
  blueprint.app.database.connect (callback);
};
