const { Service } = require ('@onehilltech/blueprint');
const HttpLoader = require ('../../lib/loader');

/**
 * @class HttpService
 *
 * The http service for the module.
 */
module.exports = Service.extend ({
  init () {
    this._super (...arguments);

    // We are going to listen for the module loaded message. This will allow
    // this service to load resources from the loaded module.

    this._httpLoader = new HttpLoader (this.app);
    this.app.on ('blueprint.module.loaded', (module) => this._handleModuleLoaded (module));
  },

  /**
   * @override
   */
  async configure (app) {
    // Load the main application resources, and import them into the main application.
    const resources = await this._httpLoader.load (app.appPath);
    app.import (resources);

    // Now, we are going to create a router from the routers defined in the application
    // resources. We do not worry about the individual modules because routers from
    // modules are not automatically mounted.
  },

  /**
   * Handle loading a module into memory.
   *
   * @param module          Loaded Blueprint module
   * @private
   */
  async _handleModuleLoaded (module) {
    // Load the http resources from this module.
    const resources = await this._httpLoader.load (module.modulePath);

    // Import the resources into the application module, and let's import the
    // resources into the application.
    module.import (resources);
    this.app.import (resources);
  }
});
