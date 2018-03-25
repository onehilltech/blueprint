const assert = require ('assert');
const Loader = require ('./loader');
const path   = require ('path');
const async  = require ('async');

const {
  stat,
  readdir
} = require ('fs-extra');

const {
  forOwn
} = require ('lodash');

const LegacyListener = require ('./messaging/legacy-listener');

/**
 * @class ListenerLoader
 *
 * Loader class designed for loading application listeners.
 */
module.exports = Loader.extend ({
  init () {
    this._super.init.apply (this, arguments);

    assert (!!this.app, "You must define the 'app' property");
  },

  load (opts) {
    let {dirname} = opts;

    assert (!!dirname, 'Your options must have a `dirname` property');

    return stat (dirname).then (stats => {
      return stats.isDirectory () ? readdir (dirname) : {};
    }).then (eventNames => {
      // The name of each directory represents the name of an event. Each file
      // inside the directory is a listener for the event.

      let promises = [];
      let listeners = {};

      // Load the listeners for each event in parallel.

      eventNames.forEach (eventName => {
        const eventPath = path.join (dirname, eventName);
        promises.push (this._loadListenersFromPath (eventPath));
      });

      // Merge the loaded listeners into a single object.

      return Promise.all (promises).then (results => {
        eventNames.forEach ((eventName, i) => {
          let loaded = results[i];
          listeners[eventName] = loaded;

          forOwn (loaded, (listener, name) => {
            listener.name = name;
            this.app.messaging.on (eventName, listener);
          })
        });

        return listeners;
      });
    }).catch (err => {
      if (err.code && err.code === 'ENOENT')
        return {};

      return Promise.reject (err);
    });
  },

  _loadListenersFromPath (eventPath) {
    const app = this.app;

    return stat (eventPath).then (stats => {
      if (!stats.isDirectory ())
        return {};

      let loader = new Loader ();

      return loader.load ({
        dirname: eventPath,
        recursive: false,
        resolve (listener) {
          // The listener exported from this module is a Listener class. We need to
          // instantiate the type and store it. Otherwise, we are working with a legacy
          // listener and need to wrap it in a LegacyListener object.
          return listener.prototype && !!listener.prototype.handleEvent ? new listener ({app}) : new LegacyListener ({app, listener});
        }
      });
    });
  }
});
