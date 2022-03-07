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

const path  = require ('path');
const fse = require ('fs-extra');
const debug  = require ('debug')('blueprint:app');
const assert = require ('assert');
const { get, isArray, mapValues } = require ('lodash');

const lookup = require ('./-lookup');
const { BO, computed } = require ('base-object');
const BPromise = require ('bluebird');

const ApplicationModule = require ('./application-module');
const ModuleLoader      = require ('./module-loader');
const RouterBuilder     = require ('./router-builder');
const Server            = require ('./server');
const Loader            = require ('./loader');

const { Events } = require ('./messaging');

const DEFAULT_APPLICATION_NAME = '<unnamed>';
const APPLICATION_MODULE_NAME = '$';

/**
 * @class Application
 *
 * The main application.
 */
module.exports = BO.extend (Events, {
  /// The started state of the application.
  started: false,

  /// The application module for the application.
  _appModule: null,

  /// The loader used by the application module.
  _defaultLoader: new Loader (),

  /// The temporary path for the application.
  tempPath: computed ({
    configurable: true,
    get () { return path.resolve (this.appPath, '.blueprint'); }
  }),

  viewsPath: computed ({
    get () { return this._appModule.viewsPath; }
  }),

  /// Resource loaded by the application.
  resources: computed ({
    get () { return this._appModule.resources; }
  }),

  /// The server used by the application.
  server: computed ({
    get () { return this._server; }
  }),

  module: computed ({
    get () { return this._appModule; }
  }),

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};

    // First, make sure the temp directory for the application exist. Afterwards,
    // we can progress with configuring the application.
    this._appModule = new ApplicationModule ({
      name: APPLICATION_MODULE_NAME,
      app: this,
      modulePath: this.appPath
    });

    this._server = new Server ({app: this});
  },

  /**
   * Configure the application.
   */
  configure () {
    return fse.ensureDir (this.tempPath)
      .then (() => this._loadConfigurationFiles ())
      .then (configs => {
        // Store the loaded configuration files.
        this.configs = configs;
        this.name = get (configs, 'app.name', DEFAULT_APPLICATION_NAME);

        // Load all the modules for the application that appear in the node_modules
        // directory. We consider these the auto-loaded modules for the application.
        // We handle these before the modules that are explicitly loaded by the application.

        let moduleLoader = new ModuleLoader ({app: this});
        //moduleLoader.on ('loading', module => this._modules[module.name] = module);
        moduleLoader.on ('loaded', module => this.addModule (module.name, module));

        return moduleLoader.load ();
      })
      // Now, we can configure the module portion of the application since we know all
      // dependent artifacts needed by the application will be loaded.
      .then (() => this._appModule.configure ())
      .then (() => this._importResources (this.appPath))
      .then (() => {
        // Allow the loaded services to configure themselves.
        const {services} = this.resources;

        return BPromise.props (mapValues (services, (service, name) => {
          debug (`configuring service ${name}`);

          return service.configure ();
        }));
      })

      .then (() => this._server.configure (this.configs.server))
      // Import the views of the application into the server. The views of the
      // application will overwrite any views previously imported when we loaded
      // an application module.
      .then (() => this._appModule.hasViews ? this._server.importViews (this._appModule.viewsPath) : null)
      .then (() => {
        const builder = new RouterBuilder ({app: this});
        const {routers} = this.resources;

        return builder.addRouter ('/', routers).build ();
      })
      .then (router => {
        // Install the built router into the server.
        this._server.setMainRouter (router);

        // Allow the loaded controllers to configure themselves.
        const { controllers } = this.resources;

        function configure (controller, name) {
          debug (`configuring controller ${name}`);

          if (!!controller.configure) {
            return controller.configure ();
          }
          else {
            return mapValues (controller, configure);
          }
        }

        return BPromise.props (mapValues (controllers, configure))
          .then (() => this.emit ('blueprint.app.initialized', this));
      })
      .then (() => this);
  },

  /**
   * Destroy the application.
   */
  destroy () {
    return this._server.close ().then (() => {
      // Instruct each service to destroy itself.
      let { services } = this.resources;

      return BPromise.props (mapValues (services, (service, name) => {
        debug (`destroying service ${name}`);
        return service.destroy ();
      }));
    });
  },

  /**
   * Add an application module to the application. An application module can only
   * be added once. Two application modules are different if they have the same
   * name, not module path. This will ensure we do not have the same module in
   * different location added to the application more than once.
   */
  async addModule (name, appModule) {
    if (this._modules.hasOwnProperty (name))
      throw new Error (`duplicate module ${name}`);

    // Import the resources from the module into the application space.
    await this._importResources (appModule.modulePath);
    await this._importViewsFromModule (appModule);
    await this._appModule.merge (appModule);

    this._modules[name] = appModule;

    return this;
  },

  /**
   * Import the resources from the application path.
   *
   * @param appPath
   * @private
   */
  async _importResources (appPath) {
    // Check if the source application has a resource directory. If it does not, then
    // we can just bail at this point in time.

    const src = path.resolve (appPath, 'resources');

    if (!await fse.pathExists (src))
      return;

    // Make sure the target resource path exists.
    const dest = path.resolve (this.tempPath, 'resources');
    await fse.ensureDir (dest);

    // Copy the resources from the app path to this path. We allow resources
    // to overwrite other resources. This gives the application the ability to
    // customize resources used by modules.
    await fse.copy (src, dest, { overwrite: true });
  },

  _importViewsFromModule (appModule) {
    if (!appModule.hasViews)
      return Promise.resolve ();

    return this._server.importViews (appModule.viewsPath);
  },

  /**
   * Start the application. This method connects to the database, creates a
   * new server, and starts listening for incoming messages.
   */
  start () {
    // Notify the listeners that we are able to start the application. This
    // will allow them to do any preparations.
    this.emit ('blueprint.app.starting', this);

    // Start all the services.
    let {services} = this.resources;
    let promises = mapValues (services, (service, name) => {
      debug (`starting service ${name}`);

      return service.start ();
    });

    return BPromise.props (promises)
      .then (() => this._server.listen ())
      .then (() => {
        // Notify all listeners that the application has started.
        this.started = true;
        return this.emit ('blueprint.app.started', this);
      });
  },

  /**
   * Restart the application.
   */
  restart () {
    return this.emit ('blueprint.app.restart', this);
  },

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
  },

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
  },

  assetSync (filename, opts) {
    return this._appModule.assetSync (filename, opts);
  },

  /**
   * Mount a router. The returned router is an Express router that can be
   * bound to any path in the router specification via the `use` property.
   *
   * @param routerName
   */
  mount (routerName) {
    debug (`mounting router ${routerName}`);

    const router = this.lookup (`router:${routerName}`);
    assert (!!router, `The router {${routerName}} does not exist.`);

    const builder = new RouterBuilder ({app: this});
    return builder.addRouter ('/', router).build ();
  },

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
});
