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
  },

  /**
   * Add a new model to the registry.
   *
   * @param Model
   */
  addModel (Model) {
    const key = this.getKeyFromModel (Model);

    if (this._models[key] !== undefined)
      return;

    // Put in a placeholder for the time being. This will prevent a model from
    // being processed multiple times.
    debug (`creating populator for ${key}`);

    this._models[key] = null;
    this._models[key] = this._makePopulate (Model.db, Model.schema);
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

        const elementModel = db.models[ref];
        populate[pathName] = new PopulateElement (elementModel);

        this.addModel (elementModel, callback);
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
          const arrModel = db.models[type.ref];
          populate[pathName] = new PopulateArray (arrModel);

          this.addModel (arrModel, callback);
        }
      }
    });
  }
});

ModelRegistry.getKeyFromModel = function (Model) {
  return Model.db.name + ':' + Model.modelName;
};

module.exports = ModelRegistry;
