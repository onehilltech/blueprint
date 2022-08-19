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

const Loader = require ('../loader');
const { stat, readdir } = require ('fs-extra');

const {
  forOwn
} = require ('lodash');

const SimpleListener = require ('./simple-listener');

/**
 * @class ListenerLoader
 *
 * Loader class designed for loading application listeners.
 */
module.exports = class ListenerLoader extends Loader {
  constructor (app) {
    super ();

    this.app = app;
  }

  /**
   * Load the listeners into memory.
   *
   * @param opts
   * @returns {Promise<*>}
   */
  async load (opts) {
    const { dirname } = opts;

    assert (!!dirname, 'Your options must have a `dirname` property');

    try {
      // Determine if the path is a directory. If it is a directory, then
      // we need to read the names.

      const stats = await stat (dirname);

      if (!stats.isDirectory ())
        return {};

      // The name of each directory represents the name of an event. Each file
      // inside the directory is a listener for the event.

      const eventNames = await readdir (dirname);

      // Load the listeners for each event in parallel.
      const results = await Promise.all (
        eventNames.map (eventName => {
          const eventPath = path.join (dirname, eventName);
          return this._loadListenersFromPath (eventPath);
        }));

      // Merge the loaded listeners into a single object. In the process, register
      // the listener for the target event.

      return eventNames.reduce ((listeners, eventName, i) => {
        // Map the results to the listener hash, and then catch the listeners
        // so we can use them later.

        forOwn (results[i], (listener, name) => {
          // Let's name the listener for debugging purposes.
          if (!listener.name)
            listener.name = name;

          // Listen for events.
          this.app.on (eventName, listener);

          listeners[`${eventName}:${name}`] = listener;
        });

        return listeners;
      }, {});
    }
    catch (err) {
      if (err.code && err.code === 'ENOENT')
        return {};

      throw err;
    }
  }

  /**
   * Helper method to load listeners from a given path.
   *
   * @param eventPath
   * @private
   */
  async _loadListenersFromPath (eventPath) {
    const app = this.app;

    return super.load ({
      dirname: eventPath,
      recursive: false,
      resolve (listener) {
        // The listener exported from this module is a Listener class. We need to
        // instantiate the type and store it. Otherwise, we are working with a legacy
        // listener and need to wrap it in a SimpleListener object.

        return listener.prototype && !!listener.prototype.handleEvent ?
          new listener (app) :
          new SimpleListener (app, listener);
      }
    });
  }
}
