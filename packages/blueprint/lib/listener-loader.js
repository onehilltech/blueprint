/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const assert = require ('assert');
const path   = require ('path');

const Loader = require ('./loader');

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
  /// The target messenger where the listeners are loaded. The messenger
  /// must support the following interface/methods:
  ///
  /// * emit
  /// * on
  /// * once
  ///
  app: null,

  init () {
    this._super.call (this, ...arguments);

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

            this.app.on (eventName, listener);
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
