const CoreObject = require ('core-object');
const debug = require ('debug') ('blueprint-mongodb:populate:registry');

const PopulateElement = require ('./populate-element');
const PopulateEmbeddedArray = require ('./populate-embedded-array');
const PopulateArray = require ('./populate-array');

const {
  Schema
} = require ('mongoose');

const {
  forOwn
} = require ('lodash');

/**
 * @class ModelRegistry
 *
 * Collection of registered models that we can populate.
 */
const ModelRegistry = CoreObject.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._models = {};

    Object.defineProperty (this, 'models', {
      get () { return this._models; }
    });

    Object.defineProperty (this, 'modelTypes', {
      get () {
        return Object.keys (this._models).map (key => key.split (':')[1]);
      }
    })
  },

  /**
   * Add a new model to the registry.
   *
   * @param Model
   */
  addModel (Model) {
    const key = ModelRegistry.getKeyFromModel (Model);

    if (this._models[key] !== undefined)
      return;

    // Put in a placeholder for the time being. This will prevent a model from
    // being processed multiple times.
    debug (`creating populator for ${key}`);

    this._models[key] = null;
    this._models[key] = this._makePopulate (Model.db, Model.schema);
  },

  lookup (Model) {
    const key = Model.db.name + ':' + Model.modelName;
    return this._models[key];
  },

  _makePopulate (db, schema) {
    let populate = {};

    forOwn (schema.paths, (path, pathName) => {
      if (pathName === '__v')
        return;

      const {instance} = path;

      if (instance === 'ObjectID' && pathName !== '_id') {
        // The instance type is an ObjectID, and it is not the _id. This means it
        // could be a reference to another model in a different collection. Let's
        // check that before we continue.

        const ref = path.options.ref;

        if (!ref)
          return;

        // This is a reference to a model in either this collection, or another
        // collection in the database.

        const Model = db.models[ref];
        const key = ModelRegistry.getKeyFromModel (Model);

        populate[pathName] = new PopulateElement ({Model, key});

        this.addModel (Model);
      }
      else if (instance === 'Array') {
        // We can either be populating references to documents, or sub-documents.
        let type = path.options.type[0];

        if ((type instanceof Schema)) {
          // This path is for an embedded array of documents. We need to build
          // the populate map for the embedded array type. If there is at least
          // one field that can be populated, then we need to add this path to
          // the populate object.

          let result = this._makePopulate (db, type);

          if (Object.keys (result).length)
            populate[pathName] = new PopulateEmbeddedArray (result);
        }
        else if (type.ref) {
          // We have an array of document references.
          const Model = db.models[type.ref];
          const key = ModelRegistry.getKeyFromModel (Model);

          populate[pathName] = new PopulateArray ({Model, key});

          this.addModel (Model);
        }
      }
    });

    return populate;
  }
});

ModelRegistry.getKeyFromModel = function (Model) {
  return Model.db.name + ':' + Model.modelName;
};

module.exports = ModelRegistry;
