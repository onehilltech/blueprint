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

const { statSync } = require ('fs-extra');
const path   = require ('path');
const assert = require ('assert');
const { BO } = require ('base-object');
const ApplicationModule = require ('./application-module');
const Events = require ('./messaging/events');

const { forEach, find } = require ('lodash');
const debug = require ('debug') ('blueprint:module-loader');

const KEYWORD_BLUEPRINT_MODULE = 'blueprint-module';
const FILE_PACKAGE_JSON = 'package.json';

function isBlueprintModule (packageObj) {
  return packageObj.keywords && packageObj.keywords.indexOf (KEYWORD_BLUEPRINT_MODULE) !== -1;
}

module.exports = BO.extend (Events, {
  /// The target application for the loader.
  app: null,

  /// Collection of loaded modules.
  _modules: null,

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};

    assert (!!this.app, 'You must define the app property');
  },

  load () {
    const packageFile = path.resolve (this.app.appPath, '..', FILE_PACKAGE_JSON);
    const packageObj = require (packageFile);

    return (packageObj || packageObj.dependencies) ? this._handleDependencies (packageObj.dependencies) : Promise.resolve ();
  },

  /**
   * Handle the dependencies in the module.
   *
   * @param dependencies
   * @returns {Promise<unknown[]>}
   * @private
   */
  _handleDependencies (dependencies) {
    let promises = [];

    debug (`dependencies: ${Object.keys (dependencies)}`);
    forEach (dependencies, (version, name) => promises.push (this._handleNodeModule (name, version)));

    return Promise.all (promises);
  },

  /**
   * Handle node-specific modules.
   *
   * @param name
   * @param version
   * @returns {*}
   * @private
   */
  _handleNodeModule (name, version) {
    // Do not process the module more than once.
    if (!!this._modules[name])
      return;

    // Open the package.json file for this node module, and determine
    // if the module is a Blueprint.js module.
    let modulePath;

    if (version.startsWith ('file:')) {
      // The file location is relative to the blueprint application.
      let relativePath = version.slice (5);
      modulePath = path.resolve (this.app.appPath, '..', relativePath);
    }
    else {
      modulePath = this._resolveModulePath (name);
    }

    const packageFile = path.resolve (modulePath, FILE_PACKAGE_JSON);
    const packageObj = require (packageFile);

    // Do not continue if the module is not a Blueprint module, or we have
    // already loaded this module into memory.

    if (!isBlueprintModule (packageObj) || !!this._modules[name])
      return;

    debug (`first time seeing ${name}; adding to list of dependencies...`);

    // Create a new application module.
    const moduleAppPath = path.resolve (modulePath, 'app');
    const module = new ApplicationModule ({name, app: this.app, modulePath: moduleAppPath});

    // Save the module so we do not process it again.
    this._modules[name] = module;

    // Load the dependencies for this module, then configure this module, and
    // then add this module to the application.
    const { dependencies } = packageObj;

    return this._handleDependencies (dependencies)
      .then (() => this.emit ('loading', module))
      .then (() => {
        debug (`configuring ${name}`);
        return module.configure ();
      })
      .then (module => this.emit ('loaded', module));
  },

  _resolveModulePath (name) {
    // Let's make sure the node_modules for the application appear on the path. This is
    // important for examples applications that reside within an existing application
    const paths = [path.resolve (this.app.appPath, '../node_modules'), ...module.paths];

    let basename = find (paths, basename => {
      let modulePath = path.resolve (basename, name, 'package.json');

      try {
        return statSync (modulePath).isFile ();
      }
      catch (err) {
        return false;
      }
    });

    if (!basename)
      throw new Error (`Cannot locate modules for ${name}`);

    return path.resolve (basename, name);
  }
});
