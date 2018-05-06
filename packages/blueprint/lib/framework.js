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

const assert    = require ('assert');
const program   = require ('commander');

const { BO, computed} = require ('base-object');

const { env } = require ('./environment');
const {version} = require ('../package.json');
const ClusterApplication = require ('./cluster');
const Application = require ('./application');

/**
 * @class Framework
 *
 * Wrapper class for the Blueprint framework that hosts the application.
 */
module.exports = BO.extend ({
  version,

  /// The application installed in the framework.
  _app: null,

  /// The execution environment for the framework.
  env,

  app: computed ({
    get () { return this._app; }
  }),

  hasApplication: computed ({
    get () { return !!this._app; }
  }),

  init () {
    this._super.call (this, ...arguments);
    this._parseCommandLineOptions ();
  },

  /**
   * Parse the command-line options.
   *
   * @private
   */
  _parseCommandLineOptions () {
    program
      .option ('--cluster [workers]', 'Run cluster mode with optional number of workers', parseInt)
      .parse (process.argv);

    this.cluster = program.cluster;
  },

  /**
   * Create an application in the framework.
   *
   * @param appPath
   */
  createApplication (appPath) {
    assert (!this._app, 'The framework already has an application.');

    if (this.cluster)
      this._app = new ClusterApplication ({appPath, cluster: this.cluster});
    else
      this._app = new Application ({appPath});

    return this._app.configure ();
  },

  /**
   * Create an application in the framework as start it.
   *
   * @param appPath
   */
  createApplicationAndStart (appPath) {
    return this.createApplication (appPath).then (app => {
      return app.start ();
    });
  },

  /**
   * Destroy the application.
   *
   * @returns {Promise<any>}
   */
  destroyApplication () {
    if (!this._app)
      return Promise.resolve ();

    return this._app.destroy ().then (() => {
      this._app = null;
    });
  },

  /**
   * Lookup a loaded component.
   *
   * The name of the component must have the format <type:name>.
   *
   * Ex.
   *
   *   lookup ('controller:main')
   *   lookup ('config:app')
   *
   * @param component       Name of the component.
   */
  lookup (component) {
    assert (this._app, 'The application has not been created.');
    return this._app.lookup (component);
  },

  /**
   * Load an asset from the main application.
   *
   * @param filename
   * @param opts
   * @param callback
   * @returns {*}
   */
  asset (filename, opts, callback) {
    assert (this._app, 'The application has not been created.');
    return this._app.asset (filename, opts, callback);
  },

  assetSync (filename, opts) {
    assert (this._app, 'The application has not been created.');
    return this._app.assetSync (filename, opts);
  },

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  mount (routerName) {
    assert (this._app, 'The application has not been created.');
    return this._app.mount (routerName);
  },

  // Events

  on () {
    assert (this._app, 'The application has not been created.');
    return this._app.on (...arguments);
  },

  once () {
    assert (this._app, 'The application has not been created.');
    return this._app.once (...arguments);
  },

  emit () {
    assert (this._app, 'The application has not been created.');
    return this._app.emit (...arguments);
  },

  getListeners (ev) {
    assert (this._app, 'The application has not been created.');
    return this._app.getListeners (ev);
  },

  hasListeners (ev) {
    assert (this._app, 'The application has not been created.');
    return this._app.hasListeners (ev);
  }
});
