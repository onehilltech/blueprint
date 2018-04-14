const CoreObject = require ('./object');
const debug  = require ('debug') ('blueprint:application-module');
const path   = require ('path');
const assert = require ('assert');

const lookup = require ('./-lookup');

const {
  merge
} = require ('lodash');

const fs     = require ('fs-extra');
const Loader = require ('./loader');
const ListenerLoader = require ('./listener-loader');
const Router = require ('./router');

module.exports = CoreObject.extend ({
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

  init () {
    this._super.call (this, ...arguments);
    this._resources = {};

    assert (!!this.app, "You must define the 'app' property.");
    assert (!!this.modulePath, "You must define the 'modulePath' property.");

    // The entities that are loaded by the application module. The order of the
    // entities is important.

    this._entities = [
      { name: 'listeners', loader: new ListenerLoader ({messenger: this.app}) },
      {
        name: 'services',
        opts: {
          resolve: this._instantiateComponent.bind (this)
        }
      },
      { name: 'models'},
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
        opts: {
          resolve (router) {
            return router.prototype && !!router.prototype.build ? new router () : new Router ({specification: router});
          }
        }
      }
    ];

    // Define the setters/getters for the object.

    Object.defineProperty (this, 'viewsPath', {
      get () {
        return path.join (this.modulePath, 'views');
      }
    });

    Object.defineProperty (this, 'hasViews', {
      get () {
        try {
          return fs.statSync (this.viewsPath).isDirectory ();
        }
        catch (ex) {
          return false;
        }
      }
    });

    Object.defineProperty (this, 'resources', {
      get () { return this._resources; }
    });
  },

  _instantiateComponent (Component) {
    return new Component ({app: this.app});
  },

  /**
   * Test of the application module has views.
   *
   * @returns {boolean}
   */
  get hasViews () {
    try {
      return fs.statSync (this.viewsPath).isDirectory ();
    }
    catch (ex) {
      return false;
    }
  },

  /**
   * Configure the application module. This method will load all the resource
   * entities for the application module into memory.
   *
   * @returns {Promise<ApplicationModule>}
   */
  configure () {
    let promises = [];

    this._entities.forEach (entity => {
      // Compute the location of the resources we are loading. Then load the resources
      // into memory and save the resources to our application module
      let location = entity.location || entity.name;
      let rcPath = path.resolve (this.modulePath, location);
      let opts = merge ({dirname: rcPath}, entity.opts);

      debug (`loading ${entity.name} in ${rcPath}`);
      let loader = entity.loader || this._defaultLoader;

      promises.push (loader.load (opts));
    });

    return Promise.all (promises).then (results => {
      this._entities.forEach ((entity, i) => {
        const {name} = entity;

        this._resources[name] = merge (this._resources[name] || {}, results[i]);
      });

      return Promise.resolve (this);
    });
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
   * @param filename          Location of asset
   * @param opts              Options
   * @param callback          Optional callback
   * @returns {*}
   */
  asset (filename, opts, callback) {
    let fullPath = path.resolve (this.modulePath, 'assets', filename);

    if (callback)
      return fs.readfile (fullPath, opts, callback);
    else
      return fs.readFileSync (fullPath, opts);
  },

  /**
   * Merge an module with this module. It will copy all the entities from the
   * source module into this module. Any entity in the source module will overwrite
   * the entity in this module.
   *
   * @param module
   */
  merge (module) {
    return new Promise ((resolve) => {
      this._entities.forEach (entity => {
        const {name} = entity;

        this.resources[name] = merge (this.resources[name] || {}, module.resources[name]);
      });

      resolve (null);
    });
  }
});
