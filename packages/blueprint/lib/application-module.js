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

const { BO, computed } = require ('base-object');
const debug  = require ('debug') ('blueprint:application-module');
const path   = require ('path');
const assert = require ('assert');

const lookup = require ('./-lookup');

const { merge, reduce, omit, get } = require ('lodash');
const { readFile, readFileSync, statSync } = require ('fs-extra');

const Loader = require ('./loader');
const ListenerLoader = require ('./listener-loader');
const Router = require ('./router');

module.exports = BO.extend ({
  /// Name of the application module.
  name: null,

  /// Application hosting the module.
  app: null,

  /// The path for the application module.
  modulePath: null,

  /// The path where the views are located.
  _viewsPath: null,

  /// The loader used by the application module.
  _defaultLoader: new Loader (),

  _entities: null,

  /// Collection of resources loaded by the application module.
  _resources: null,

  __configure_Promise: null,

  viewsPath: computed ({
    get () {
      return path.join (this.modulePath, 'views');
    }
  }),

  hasViews: computed ({
    get () {
      try {
        return statSync (this.viewsPath).isDirectory ();
      }
      catch (ex) {
        return false;
      }
    }
  }),

  assetsPath: computed ({
    get () { return path.resolve (this.modulePath, 'assets') }
  }),

  resources: computed ({
    get () { return this._resources; }
  }),

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.app, "You must define the 'app' property.");
    assert (!!this.modulePath, "You must define the 'modulePath' property.");

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
      { name: 'listeners', loader: new ListenerLoader ({app: this.app}) },
      {
        name: 'controllers',
        opts: {
          resolve: this._instantiateComponent.bind (this)
        }
      },
      { name: 'policies'},
      { name: 'validators'},
      { name: 'sanitizers'},
      {
        name: 'routers',
        mergeable: false,
        opts: {
          resolve (router) {
            return router.prototype && !!router.prototype.build ? new router () : new Router ({specification: router});
          }
        }
      }
    ];
  },

  _instantiateComponent (Component) {
    return new Component ({app: this.app});
  },

  /**
   * Configure the application module. This method will load all the resource
   * entities for the application module into memory.
   *
   * @returns {Promise<ApplicationModule>}
   */
  configure () {
    // We should only load this module once. Once it is in the loaded state, we just need
    // to return the loaded promise.
    if (!!this.__configure_Promise)
      return this.__configure_Promise;

    debug (`configuring the application module ${this.modulePath}`);

    this.__configure_Promise = new Promise ((resolve, reject) => {
      let promise = reduce (this._entities, (promise, entity) => {
        return promise.then (() => {
          // Compute the location of the resources we are loading. Then load the resources
          // into memory and save the resources to our application module
          let {name} = entity;
          let location = entity.location || name;
          let rcPath = path.resolve (this.modulePath, location);
          let opts = merge ({dirname: rcPath}, entity.opts);

          debug (`loading ${name} in ${rcPath}`);
          let loader = entity.loader || this._defaultLoader;

          return loader.load (opts).then (resources => {
            // Merge the resources into the application module, and then merge them
            // into the parent application. This means we will have two copies of the
            // resources, but that is fine. We need the ability to load a resource from
            // its parent module, if necessary.
            debug (`merging ${name} into both application module and application`);
            const mergeable = get (entity, 'mergeable', true);

            this._resources[name] = merge (this._resources[name] || {}, resources);

            if (mergeable) {
              this.app.resources[name] = merge (this.app.resources[name] || {}, resources);
            }
          });
        });
      }, Promise.resolve ());

      promise.then (() => resolve (this)).catch (reject);
    });

    return this.__configure_Promise;
  },

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
  },

  /**
   * Read an application asset. If the callback is undefined, then the data in the
   * resource is returned to the caller.
   *
   * @returns {*}
   */
  asset (filename, opts) {
    let fullPath = path.resolve (this.assetsPath, filename);
    return readFile (fullPath, opts);
  },

  assetSync (filename, opts) {
    let fullPath = path.resolve (this.assetsPath, filename);
    return readFileSync (fullPath, opts);
  },

  /**
   * Merge an module with this module. It will copy all the entities from the
   * source module into this module. Any entity in the source module will overwrite
   * the entity in this module.
   *
   * @param module
   */
  merge (module) {
    return merge (this._resources, omit (module.resources, ['routers']));
  }
});
