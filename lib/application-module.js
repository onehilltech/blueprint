const Object = require ('./object');
const debug  = require ('debug') ('blueprint:application-module');
const {each} = require ('async');
const path   = require ('path');
const _      = require ('lodash');
const Loader = require ('./loader');

const BUILTIN_ENTITIES = [
  { name: 'configs', location: 'configs' },
  { name: 'models', location: 'models' },
  {
    name: 'listeners',
    location: 'listeners',
    opts: {
      recursive: false,
      map (name, path) {
        return name;
      }
    }
  }
];

module.exports = Object.extend ({
  /// The application path for the module.
  modulePath: null,

  /// The loader used by the application module.
  _loader: new Loader (),

  init () {
    this._super.call (this, ...arguments);
    this._resources = {};
  },

  /**
   * Load all the resources for the application module into memory.
   *
   * @returns {Promise<ApplicationModule>}
   */
  load () {
    return new Promise ((resolve, reject) => {
      each (BUILTIN_ENTITIES, (rc, callback) => {
        // Compute the location of the resources we are loading. Then load the resources
        // into memory and save the resources to our application module.
        let rcPath = path.resolve (this.modulePath, rc.location);
        let opts = _.merge ({dirname: rcPath}, rc.opts);

        debug (`loading ${rc.name} in ${rcPath}`);

        this._loader.load (opts).then (resources => {
          this._resources[rc.name] = resources;

          callback (null);
        }).catch (err => {
          callback (err);
        });
      }, (err) => {
        if (err) return reject (err);
        return resolve (this);
      })
    });
  }
});
