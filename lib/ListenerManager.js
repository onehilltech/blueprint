var util            = require ('util')
  , _               = require ('underscore')
  , path            = require ('path')
  , fs              = require ('fs')
  , ResourceManager = require ('./ResourceManager')
  ;

function ListenerManager (messaging, opts) {
  ResourceManager.call (this, 'policies', opts);
  this._messaging = messaging;
}

util.inherits (ListenerManager, ResourceManager);

ListenerManager.prototype.load = function (listenerPath, opts) {
  var messaging = this._messaging;
  var self = this;

  function resolve (listener) {
    var key = listener.targetMessenger || '_';
    var messenger = messaging.getMessenger (key);

    messenger.on (this.eventName, listener);

    return listener;
  }

  try {
    // Determine if the application has defined any listeners. If this is the
    // case, then load all the listeners and register them.
    var stats = fs.lstatSync (listenerPath);

    if (stats.isDirectory ()) {
      // Each directory in the listener path is the name of the event we are
      // listening for. Each file in the event directory is a listener to be
      // registered with the messaging service.
      var files = fs.readdirSync (listenerPath);

      files.forEach (function (file) {
        // Determine if the current file is a directory. If the path is a directory,
        // then we are processing an event name.
        var eventPath = path.join (listenerPath, file);
        stats = fs.lstatSync (eventPath);

        if (stats.isDirectory ()) {
          var tmp = new ResourceManager ('listeners');
          resolve.eventName = file;

          tmp.load (eventPath, {recursive: false, excludeDirs : /.*/, resolve: resolve});

          self._resources[file] = tmp.resources;
        }
      });
    }
    else {
      throw new Error ('The listeners application path is not a directory');
    }
  }
  catch (e) {
    // Do nothing...
  }
};

ListenerManager.prototype.__defineGetter__ ('listeners', function () {
  return this._resources;
});

module.exports = exports = ListenerManager;