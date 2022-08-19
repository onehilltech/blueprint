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

const { get, isArray, isFunction, forEach } = require ('lodash');

const ApplicationModule = require ('./application-module');
const ModuleLoader = require ('./module-loader');

const messaging = require ('./messaging');
const ListenerLoader = require ('./messaging/listener-loader');

const DEFAULT_APPLICATION_NAME = '<unnamed>';
const APPLICATION_MODULE_NAME = '$';

const { v4: uuidv4 } = require ('uuid');
const registry = require ('./registry');

const { singletonFactory } = require ('./factory');
const InstanceManager = require ('./instance-manager');

const Loader = require ('./loader');

function isFactory (Factory) {
  return !!Factory && isFunction (Factory.createInstance);
}

/**
 * @class Application
 *
 * The main application.
 */
class Application {
  constructor (appPath) {
    // The application has not started.
    this.started = false;

    this._services = new Map ();

    Object.defineProperty (this, 'appPath', { value: appPath, writable: false });
    Object.defineProperty (this, 'id', { value: uuidv4 (), writable: false });
    Object.defineProperty (this, '_instances', { value: new InstanceManager (this, registry (this.id)), writable: false } )
    Object.defineProperty (this, 'modules', { value: {}, writable: false });

    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.
    this._appModule = new ApplicationModule (this, APPLICATION_MODULE_NAME, this.appPath);

    // Register the built-in component types.
    this.defineType ('service', { location: 'services' });

    this.defineType ('listener', {
      location: 'listeners',
      loader: new ListenerLoader (this),
      factoryForType: messaging.factoryForType
    });
  }

  /**
   * The temporary path for the application.
   *
   * @return {string}
   */
  get tempPath () {
    return path.resolve (this.appPath, '../.blueprint');
  }

  /**
   * The path for application resources.
   *
   * @return {string}
   */
  get resourcePath () {
    return path.resolve (this.tempPath, 'resources');
  }

  /**
   * Register a new type with the application.
   *
   * @param type
   * @param options
   */
  defineType (type, options) {
    registry (this.id).defineType (type, options);

    return this;
  }

  /**
   * Register a new type with the application.
   *
   * @param typename        Name of type to register
   * @param Type            Type class for the registered type.
   */
  registerType (typename, Type) {
    if (!isFactory (Type))
      Type = singletonFactory (Type);

    registry (this.id).registerType (typename, Type);

    return this;
  }

  /**
   * Create a new instance.
   *
   * @param typename
   */
  createInstance (typename) {
    return registry (this.id).createInstance (typename, this);
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

    Object.defineProperty (this, 'name', {
      value: get (this.configs, 'app.name', DEFAULT_APPLICATION_NAME),
      writeable: false
    });

    // Load all the modules for the application that appear in the node_modules
    // directory. We consider these the auto-loaded modules for the application.
    // We handle these before the modules that are explicitly loaded by the application.

    const moduleLoader = new ModuleLoader (this);
    const modules = await moduleLoader.load (this._handleModule.bind (this));

    debug (modules);

    modules.forEach (module => this.modules[module.name] = module);

    // Now, we can configure the module portion of the application since we know all
    // dependent artifacts needed by the application will be loaded.
    await this._handleModule (this._appModule);

    // The service type is managed by the application. We are going to create the
    // single instance of each service, and configure it.

    const { names: services } = registry (this.id).types.get ('service');

    for (const [name] of services.names) {
      const service = services.createInstance (name, this);
      this._services.set (name, service);

      await service.configure ();
    }

    // Notify all listeners the application has been initialized.
    await this.emit ('blueprint.app.configured', this);

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

    for (const [name, service] of this._services) {
      debug (`starting service ${name}`);

      await service.start ();
    }

    this.started = true;

    // Notify all listeners that the application has started.
    await this.emit ('blueprint.app.started', this);

    return this;
  }

  /**
   *
   * @private
   */
  async _copyFilesFrom (fromPath) {
    // Check if the source application has a resource directory. If it does not, then
    // we can just bail at this point in time.

    const src = path.resolve (fromPath, 'resources');

    if (!await fse.pathExists (src))
      return;

    // Make sure the target resource path exists.
    const dest = path.resolve (this.tempPath, 'resources');
    await fse.ensureDir (dest);

    // Copy the resources from the app path to this path. We allow resources
    // to overwrite other resources. This gives the application the ability to
    // customize resources used by modules.
    await fse.copy (src, dest, { overwrite: true });
  }

  /**
   * Handle loading of an application module.
   *
   * @param module
   * @return {Promise<void>}
   * @private
   */
  async _handleModule (module) {
    debug (`module ${module.name} has been loaded into memory`);

    // Auto-load the registered types from this module.
    const types = registry (this.id).types;

    for (const [name, registration] of types) {
      const { location, loader = new Loader (), autoload = true, factoryForType = singletonFactory } = registration;

      if (autoload && location) {
        debug (`registering ${name} resources from module ${module.name}`);
        const { names } = registration;

        // Get the full location of the types to load from the module. Then use that location
        // to load all types into memory.

        const dirname = path.resolve (module.appPath, location);
        const resources = await loader.load ({ dirname });

        forEach (resources, (Type, name) => {
          // Check if the type is a factory. If the type is not a factory, then we are going
          // to provide a default factory.

          if (!isFactory (Type))
            Type = factoryForType (Type);

          names.register (name, Type, false);
        });
      }
    }

    // Copy the pertinent files from the module to the application.
    const rcPath = path.resolve (module.modulePath, '..');
    await this._copyFilesFrom (rcPath);
  }

  /**
   * Destroy the application.
   */
  async destroy () {
    // Destroy the loaded services. We do not need to call destroy on the listeners
    // we loaded into the application.

    for (const [name, service] of this._services) {
      debug (`destroying service ${name}`);

      await service.destroy ();
    }
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
   * @param component         Component instance to lookup
   *
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
        return this.createInstance (component);
    }
    else if (component.startsWith ('config:')) {
      // The configuration components are a special case because we do not
      // lump them with the other resources that can be defined in a module.
      const name = component.slice (7);
      return get (this.configs, name);
    }
    else {
      return this.createInstance (component);
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
    const loader = new Loader ();
    const dirname = path.resolve (this.appPath, 'configs');

    return loader.load ({dirname});
  }

  /// Application Messaging

  on () {
    return messaging (this.id).on (...arguments);
  }

  once () {
    return messaging (this.id).once (...arguments);
  }

  emit () {
    return messaging (this.id).emit (...arguments);
  }

  getListeners () {
    return messaging (this.id).getListeners (...arguments);
  }

  hasListeners () {
    return messaging (this.id).hasListeners (...arguments);
  }
}

module.exports = Application;

