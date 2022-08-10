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

const debug  = require ('debug') ('blueprint:application-module');
const path   = require ('path');

const lookup = require ('./-lookup');

const { merge } = require ('lodash');
const { readFile, readFileSync, statSync } = require ('fs-extra');

/**
 * @class ApplicationModule
 */
module.exports = class ApplicationModule {
  constructor (app, name, modulePath) {
    this.app = app;
    this.name = name;
    this.modulePath = modulePath;
  }

  get tempPath () {
    return this.app.tempPath;
  }

  get assetsPath () {
    return path.resolve (this.modulePath, '../assets')
  }

  get resourcePath () {
    return this.app.resourcePath;
  }

  /**
   * Lookup a loaded component. The format of the name is
   *
   *   type:name
   *
   * For example:
   *
   *   policy:a.b.c
   *
   * @param component
   */
  lookup (component) {
    return lookup (this.resources, component);
  }

  /**
   * Read an application asset. If the callback is undefined, then the data in the
   * resource is returned to the caller.
   *
   * @returns {*}
   */
  async asset (filename, opts) {
    let fullPath = path.resolve (this.assetsPath, filename);
    return readFile (fullPath, opts);
  }

  assetSync (filename, opts) {
    let fullPath = path.resolve (this.assetsPath, filename);
    return readFileSync (fullPath, opts);
  }

  /**
   * Import resources into the module.  Any entity in the resources will overwrite
   * the current resources in the module.
   *
   * @param resources
   */
  import (resources) {
    merge (this._resources, resources);
  }
}
