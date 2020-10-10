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

const fs = require ('fs-extra');
const path   = require ('path');
const { BO } = require ('base-object');

const { transform } = require ('lodash');

const KEYWORD_BLUEPRINT_MODULE = 'blueprint-module';
const FILE_PACKAGE_JSON = 'package.json';

function isBlueprintModule (packageObj) {
  return packageObj.keywords && packageObj.keywords.indexOf (KEYWORD_BLUEPRINT_MODULE) !== -1;
}

module.exports = BO.extend ({
  concatProperties: ['builtinModules'],

  /// The target application for the loader.
  basePath: process.cwd (),

  /// Collection of loaded modules.
  _modules: null,

  /// Callback for when a blueprint module is detected.
  callback: null,

  /// Collection of modules that should always be loaded by the finder regardless of
  /// the packaging having the keyword 'blueprint-module'.
  builtinModules: [
    '@onehilltech/blueprint'
  ],

  /// Collection of loaded blueprint modules.
  blueprintModules: null,

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};
    this.blueprintModules = [];
  },

  load () {
    const packageFile = path.resolve (this.basePath, FILE_PACKAGE_JSON);

    return Promise.resolve (this.onBlueprintModuleFound (this.basePath))
      .then (() => fs.stat (packageFile))
      .then (() => fs.readJson (packageFile))
      .then (packageObj => {
        if (packageObj || packageObj.dependencies)
          return this._handleDependencies (packageObj.dependencies);
      })
      .then (() => this)
      .catch (err => err.code === 'ENOENT' ? this : Promise.reject (err))
  },

  _handleDependencies (dependencies) {
    return Promise.all (transform (dependencies, (result, version, name) => result.push (this._handleNodeModule (name, version)), []));
  },

  _handleNodeModule (name, version) {
    // Do not process the module more than once.
    if (this._modules[name])
      return;

    // Open the package.json file for this node module, and determine
    // if the module is a Blueprint.js module.
    let modulePath = this._resolveModulePath (name);
    const packageFile = path.resolve (modulePath, FILE_PACKAGE_JSON);

    return fs.readJson (packageFile).then (packageObj => {
      // Do not continue if the module is not a Blueprint module, or we have
      // already loaded this module into memory.
      if (!isBlueprintModule (packageObj) && !this.builtinModules.includes (name))
        return;

      // Mark this module as a blueprint modules.
      this.blueprintModules.push (modulePath);

      return Promise.resolve (this.onBlueprintModuleFound (modulePath)).then (() => {
        // Mark the module as visited.
        this._modules[name] = true;

        // Load the dependencies for this module, then configure this module, and
        // then add this module to the application.
        const {dependencies} = packageObj;
        return this._handleDependencies (dependencies);
      });
    });
  },

  /**
   * Allow the subclass to handle the module.
   *
   * @param modulePath
   * @private
   */
  onBlueprintModuleFound (modulePath) {
    if (!!this.callback)
      return Promise.resolve (this.callback (this, modulePath));
  },

  _resolveModulePath (name) {
    return path.resolve (this.basePath, 'node_modules', name);
  }
});
