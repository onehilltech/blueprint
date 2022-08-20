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

const path   = require ('path');
const { readFile, readFileSync, pathExistsSync } = require ('fs-extra');

/**
 * @class ApplicationModule
 *
 * The ApplicationModule is a collection of Blueprint components that provide some
 * reusable functionality for a Blueprint application. The application module cannot
 * operate on its own.
 */
module.exports = class ApplicationModule {
  constructor (app, name, appPath) {
    Object.defineProperty (this, 'app', { value: app, writable: false });
    Object.defineProperty (this, 'name', { value: name, writable: false });
    Object.defineProperty (this, 'appPath', { value: appPath, writable: false });

    // Initialize the module
    this._initModule ();
  }

  /**
   * Helper method that initializes the module.
   *
   * @private
   */
  _initModule () {
    const moduleFile = path.resolve(this.appPath, 'module.js');

    if (pathExistsSync(moduleFile)) {
      require (moduleFile) (this.app);
    }
  }

  get modulePath () {
    return path.resolve (this.appPath, '..');
  }

  get assetsPath () {
    return path.resolve (this.modulePath, 'assets')
  }

  /**
   * Read an application module asset.
   */
  async asset (filename, opts) {
    const fullPath = path.resolve (this.assetsPath, filename);
    return readFile (fullPath, opts);
  }

  /**
   * Synchronously read an application module asset.
   */
  assetSync (filename, opts) {
    const fullPath = path.resolve (this.assetsPath, filename);
    return readFileSync (fullPath, opts);
  }
}
