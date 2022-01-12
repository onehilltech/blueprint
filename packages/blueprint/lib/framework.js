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

const { env } = require ('./environment');
const { version } = require ('../package.json');
const ClusterApplication = require ('./cluster');
const Application = require ('./application');

/**
 * @class Framework
 *
 * Wrapper class for the Blueprint framework that hosts the application.
 */
module.exports = class Framework {
  constructor () {
    this._parseCommandLineOptions ();
  }

  get env ()  {
    return env;
  }

  get version () {
    return version
  }

  get app () {
    return this._app;
  }

  get hasApplication () {
    return !!this._app;
  }

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
  }

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
      this._app = new Application (appPath);

    return this._app.configure ();
  }

  /**
   * Create an application in the framework as start it.
   *
   * @param appPath
   */
  async createApplicationAndStart (appPath) {
    const app = await this.createApplication (appPath);
    return app.start ();
  }

  /**
   * Destroy the application.
   */
  async destroyApplication () {
    if (this.hasApplication) {
      await this._app.destroy ();
      this._app = null;
    }
  }

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
  }

  /**
   * Load an asset from the main application.
   *
   * @param filename
   * @param opts
   * @param callback
   * @returns {*}
   */
  asset (filename, opts, callback) {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.asset (filename, opts, callback);
  }

  assetSync (filename, opts) {
    assert (this._app, 'The application has not been created.');
    return this._app.assetSync (filename, opts);
  }

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  mount (routerName) {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.mount (routerName);
  }

  // Events

  on () {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.on (...arguments);
  }

  once () {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.once (...arguments);
  }

  emit () {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.emit (...arguments);
  }

  getListeners (ev) {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.getListeners (ev);
  }

  hasListeners (ev) {
    assert (this.hasApplication, 'The application has not been created.');
    return this._app.hasListeners (ev);
  }
}
