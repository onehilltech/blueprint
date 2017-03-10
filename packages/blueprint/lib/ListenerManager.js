var util   = require ('util')
  , extend = require ('extend')
  , path   = require ('path')
  , fs     = require ('fs')
  , async  = require ('async')
  ;

var ResourceManager = require ('./ResourceManager')
  ;

function ListenerManager (messaging, opts) {
  ResourceManager.call (this, 'policies', opts);
  this._messaging = messaging;
}

util.inherits (ListenerManager, ResourceManager);

/**
 * Load the listeners in the specified locations.
 *
 * @param location        Directory location
 * @param opts            Options
 * @param callback        Callback object
 */
ListenerManager.prototype.load = function (location, callback) {
  var messaging = this._messaging;

  async.waterfall ([
    async.constant (this),
    
    function (manager, callback) {
      fs.stat (location, function (err, stats) {
        if (err) return callback (err);
        if (!stats.isDirectory ()) return callback (new Error ('Path is not a directory'));
        return callback (null, manager);
      });
    },

    function (manager, callback) {
      fs.readdir (location, function (err, files) {
        return callback (err, manager, files);
      });
    },

    function (manager, files, callback) {
      async.forEach (files, function (eventName, callback) {
        // Determine if the current file is a directory. If the path is a directory,
        // then we are processing an event name.
        var eventPath = path.join (location, eventName);

        function resolve (listener) {
          var key = listener.targetMessenger || '_';
          var messenger = messaging.getMessenger (key);

          messenger.on (eventName, listener);

          return listener;
        }

        async.waterfall ([
          function (callback) { fs.stat (eventPath, callback); },

          function (stats, callback) {
            if (!stats.isDirectory ()) return callback (null);

            var tmpManager = new ResourceManager ('listeners', {
              recursive: false,
              excludeDirs : /.*/,
              resolve: resolve
            });

            tmpManager.load (eventPath, function (err) {
              if (err) return callback (err);

              var listeners = manager._resources[eventName] || {};
              manager._resources[eventName] = extend (true, listeners, tmpManager._resources);

              return callback (null);
            });
          }
        ], callback);
      }, function (err) {
        return callback (err, manager);
      });
    }
  ], callback);
};

module.exports = exports = ListenerManager;