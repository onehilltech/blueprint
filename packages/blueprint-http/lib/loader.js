const { Loader } = require ('@onehilltech/blueprint');
const path = require ('path');
const SimpleRouter = require ('./simple-router');

/**
 * @class HttpLoader
 *
 * The loader class used by the http service/module.
 */
module.exports = class HttpLoader {
  constructor (app) {
    this._app = app;
    this._loader = new Loader ();
  }

  async load (appPath) {
    // Load the resource entities in the following order:
    // 1. controllers
    // 2. policies
    // 3. validators
    // 4. sanitizers
    // 5. routers

    const entities = [
      {
        name: 'controllers',
        opts: {
          resolve: this._instantiate.bind (this)
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
            if (router.prototype && !!router.prototype.build)
              return new router ();
            else
              return SimpleRouter.create ({ definition: router });
          }
        }
      }
    ];

    const resources = {};

    for await (const entity of entities) {
      const dirname = path.resolve (this._app.appPath, entity.name);
      const options = Object.assign ({}, entity.opts, { dirname });

      resources[entity.name] = await this._loader.load (options);
    }
  }

  _instantiate (Entity) {
    return new Entity ({app: this._app});
  }
}
