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

const Loader = require ('./loader');
const ListenerLoader = require ('./listener-loader');

/**
 * @class ApplicationModule
 */
module.exports = class ApplicationModule {
  constructor (app, name, modulePath) {
    this.app = app;
    this.name = name;
    this.modulePath = modulePath;

    this._defaultLoader = new Loader ();
    this._resources = {};

    // The entities that are loaded by the application module. The order of the
    // entities is important because come classes of components will be dependent
    // on other classes of components.

    this._entities = [
      { name: 'models'},
      {
        name: 'services',
        opts: {
          resolve: this._instantiateComponent.bind (this)
        }
      },
      { name: 'listeners', loader: new ListenerLoader (this.app) },
    ];
  }

  get viewsPath () {
    return path.join (this.modulePath, 'views');
  }

  get hasViews () {
    try {
      return statSync (this.viewsPath).isDirectory ();
    }
    catch (ex) {
      return false;
    }
  }

  get assetsPath () {
    return path.resolve (this.modulePath, 'assets')
  }

  get resources () {
    return this._resources;
  }

  _instantiateComponent (Component) {
    return new Component ({app: this.app});
  }

  /**
   * Configure the application module. This method will load all the resource
   * entities for the application module into memory.
   *
   * @returns {Promise<ApplicationModule>}
   */
  async configure () {
    debug (`configuring application module ${this.modulePath}`);

    for await (const entity of this._entities) {
      // Compute the location of the resources we are loading. Then load the
      // resources into memory and save the resources to our application module.

      const {
        name,
        location = name,
        loader = this._defaultLoader,
        mergeable = true
      } = entity;

      const rcPath = path.resolve (this.modulePath, location);
      const opts = merge ({dirname: rcPath}, entity.opts);

      // Merge the resources into the application module, and then merge them
      // into the parent application. This means we will have two copies of the
      // resources, but that is fine. We need the ability to load a resource from
      // its parent module, if necessary.

      debug (`loading ${name} in ${rcPath}`);

      const resources = await loader.load (opts);
      this._resources[name] = merge (this._resources[name] || {}, resources);

      if (mergeable) {
        this.app.resources[name] = merge (this.app.resources[name] || {}, resources);
      }
    }
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
