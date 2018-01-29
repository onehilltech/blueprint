'use strict';

const util = require ('util')
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

module.exports = ListenerManager;

/**
 * Load the listeners in the specified locations.
 *
 * @param location        Directory location
 * @param opts            Options
 * @param callback        Callback object
 */
ListenerManager.prototype.load = function (location, callback) {
  function done (err) {
    return callback (err, this);
  }

  async.waterfall ([
    function (callback) {
      fs.stat (location, callback);
    },

    function (stats, callback) {
      if (!stats.isDirectory ())
        return callback (new Error ('not a directory: ' + location));

      fs.readdir (location, callback);
    },

    function (files, callback) {
      async.forEach (files, function (eventName, callback) {
        // Determine if the current file is a directory. If the path is a directory,
        // then we are processing an event name.
        const eventPath = path.join (location, eventName);

        async.waterfall ([
          function (callback) {
            fs.stat (eventPath, callback);
          },

          function (stats, callback) {
            if (!stats.isDirectory ())
              return callback (null);

            var tmpManager = new ResourceManager ('listeners', {
              recursive: false,
              excludeDirs : /.*/,
              resolve: function resolve (listener) {
                var key = listener.targetMessenger || '_';
                var messenger = this._messaging.getMessenger (key);

                messenger.on (eventName, listener);

                return listener;
              }.bind (this)
            });

            tmpManager.load (eventPath, function (err) {
              if (err)
                return callback (err);

              var listeners = this._resources[eventName] || {};
              this._resources[eventName] = extend (true, listeners, tmpManager._resources);

              return callback (null);
            }.bind (this));
          }.bind (this)
        ], callback);
      }.bind (this), callback);
    }.bind (this)
  ], done.bind (this));
};
