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

const fse = require ('fs-extra');
const debug  = require ('debug')('blueprint:app');
const assert = require ('assert');
const path = require ('path');

const { merge, get, isArray, mapValues, map } = require ('lodash');

const lookup = require ('./-lookup');
const BPromise = require ('bluebird');

const ApplicationModule = require ('./application-module');
const ModuleLoader = require ('./module-loader');
const Loader = require ('./loader');
const events = require ('./messaging/events');

const DEFAULT_APPLICATION_NAME = '<unnamed>';
const APPLICATION_MODULE_NAME = '$';

/**
 * @class Application
 *
 * The main application.
 */
@events
class Application {
  constructor (appPath) {
    // The application has not started.
    this.started = false;

    this._appPath = appPath;
    this._modules = {};

    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.
    this._appModule = new ApplicationModule (this, APPLICATION_MODULE_NAME, this._appPath);
    this._defaultLoader = new Loader ();
  }

  get appPath () {
    return this._appPath;
  }

  /// The temporary path for the application.
  get tempPath () {
    return path.resolve (this.appPath, '../.blueprint');
  }

  /// Resource loaded by the application.
  get resources () {
    return this._appModule.resources;
  }

  get module () {
    return this._appModule;
  }

  /**
   * Configure the application.
   */
  async configure () {
    // Make sure the temporary directory for blueprint exists. This is the location
    // where modules can add the files to improve performance or track state.
    await fse.ensureDir (this.tempPath);

    // Load the configuration files.
    this.configs = await this._loadConfigurationFiles ();

    // Set the name of the application. If the name does not exists, then we set it to
    // the default name.
    this.name = get (this.configs, 'app.name', DEFAULT_APPLICATION_NAME);

    // Load all the modules for the application that appear in the node_modules
    // directory. We consider these the auto-loaded modules for the application.
    // We handle these before the modules that are explicitly loaded by the application.

    const moduleLoader = ModuleLoader.create ({app: this});

    moduleLoader.on ('loading', async (module) => {
      // Save the module currently loading.
      this._modules[module.name] = module;

      // Send the notification to all listeners.
      await this.emit ('blueprint.module.loading', module);
    });

    moduleLoader.on ('loaded', async (module) => await this.emit ('blueprint.module.loaded', module));
    await moduleLoader.load ();

    // Now, we can configure the module portion of the application since we know all
    // dependent artifacts needed by the application will be loaded.
    await this._appModule.configure (this);

    // Allow the loaded services to configure themselves.
    const { services } = this.resources;

    await BPromise.props (mapValues (services, (service, name) => {
      debug (`configuring service ${name}`);

      return service.configure ();
    }));

    // Notify all listeners the application has been initialized.
    await this.emit ('blueprint.app.initialized', this);

    return this;
  }

  /**
   * Destroy the application.
   */
  async destroy () {
    // Instruct each service to destroy itself.
    const { services } = this.resources;

    return BPromise.props (mapValues (services, (service, name) => {
      debug (`destroying service ${name}`);
      return service.destroy ();
    }));
  }

  /**
   * Add an application module to the application. An application module can only
   * be added once. Two application modules are different if they have the same
   * name, not module path. This will ensure we do not have the same module in
   * different location added to the application more than once.
   */
  async addModule (name, appModule) {
    if (this._modules.hasOwnProperty (name))
      throw new Error (`duplicate module ${name}`);

    //await this._importViewsFromModule (appModule);
    await this._appModule.merge (appModule);
    this._modules[name] = appModule;

    return this;
  }

  /**
   * Start the application. This method connects to the database, creates a
   * new server, and starts listening for incoming messages.
   */
  async start () {
    // Notify the listeners that we are able to start the application. This
    // will allow them to do any preparations.
    await this.emit ('blueprint.app.starting', this);

    // Start all the services.
    const { services } = this.resources;

    await Promise.all (map (services, (service, name) => {
      debug (`starting service ${name}`);
      return service.start ();
    }));

    this.started = true;

    // Notify all listeners that the application has started.
    await this.emit ('blueprint.app.started', this);

    return this;
  }

  /**
   * Restart the application.
   */
  async restart () {
    await this.emit ('blueprint.app.restart', this);

    return this;
  }

  /**
   * Lookup a component, including configurations, in the application. The component can
   * also be located in a module. This allows the client to search for a specific component
   * if another module overwrites it. The expected pattern for the component is:
   *
   *   type:name
   *   type:module:name
   *
   * Here are a few examples:
   *
   *   config:app
   *   controller:hello
   *   model:a.b.user
   *   model:personal:a.b.user
   *
   * @param component
   * @returns {*}
   */
  lookup (component) {
    // The component can be an array, or a string. We allow for an array because
    // the name at any given level could have a period. This would be treated as a
    // a nested name, and cause the search to go down one level.

    if (isArray (component)) {
      if (component[0] === 'config')
        return get (this.configs, component.slice (1));
      else
        return lookup (this.resources, component);
    }
    else if (component.startsWith ('config:')) {
      // The configuration components are a special case because we do not
      // lump them with the other resources that can be defined in a module.
      const name = component.slice (7);
      return get (this.configs, name);
    }
    else {
      // Split the component name into its parts. If there are 2 parts, then we
      // can search the merged resources for the application. If there are 3 parts,
      // then we need to locate the target module, and search its resources.

      const parts = component.split (':');

      if (parts.length === 2) {
        return lookup (this.resources, component);
      }
      else if (parts.length === 3) {
        // Look for the module.
        const targetModule = this._modules[parts[1]];
        assert (!!targetModule, `The module named ${targetModule} does not exist.`);

        // Construct the name of the target component by discarding the module
        // name from the original component name.

        const name = `${parts[0]}:${parts[2]}`;
        return targetModule.lookup (name);
      }
      else {
        throw new Error ('The component name is invalid.');
      }
    }
  }

  /**
   * Get the asset path for the application.
   */
  get assetsPath () {
    return this._appModule.assetsPath;
  }

  /**
   * Load an application asset.
   *
   * @param filename
   * @param opts
   * @param callback
   * @returns {*}
   */
  asset (filename, opts) {
    return this._appModule.asset (filename, opts);
  }

  /**
   * Load an application asset synchronously.
   *
   * @param filename
   * @param opts
   * @return {*}
   */
  assetSync (filename, opts) {
    return this._appModule.assetSync (filename, opts);
  }

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  async mount (routerName) {
    debug (`mounting router ${routerName}`);

    const router = this.lookup (`router:${routerName}`);
    assert (!!router, `The router {${routerName}} does not exist.`);

    const builder = new RouterBuilder (this);
    return await builder.addRouter ('/', router).build ();
  }

  /**
   * Load the configuration files for the application. All configuration files are located
   * in the app/configs directory.
   *
   * @returns {Promise}       Promise object
   * @private
   */
  _loadConfigurationFiles () {
    const dirname = path.resolve (this.appPath, 'configs');
    return this._defaultLoader.load ({dirname});
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

module.exports = Application;

