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

const {
  BO,
  computed,
} = require ('@onehilltech/blueprint');

const debug = require ('debug') ('blueprint-mongodb:populate:registry');

const PopulateElement = require ('./populate-element');
const PopulateArray = require ('./populate-array');
const PopulateEmbedded = require ('./populate-embedded');
const PopulateEmbeddedArray = require ('./populate-embedded-array');

const {
  Schema
} = require ('mongoose');

const {
  forOwn,
  isEmpty,
  uniq,
  transform
} = require ('lodash');

const pluralize = require ('pluralize');

/**
 * @class RegistryItem
 *
 * A single entry in the registry.
 */
const RegistryItem = BO.extend ({
  populators: null,

  Model: null,

  collectionName: computed ({
    get () {
      let Model = this.Model;

      while (!!Model.baseModelName)
        Model = Model.db.models[Model.baseModelName];

      return pluralize (Model.modelName);
    }
  }),
});

/**
 * @class ModelRegistry
 *
 * Collection of registered models that we can populate.
 */
const ModelRegistry = BO.extend ({
  models: computed ({
    get () { return this._models; }
  }),

  collectionNames: computed ({
    get () {
      let collectionNames = transform (this._models, (result, value, key) => {
        result.push (value.collectionName);
      }, []);

      return uniq (collectionNames);
    }
  }),

  init () {
    this._super.call (this, ...arguments);
    this._models = {};
  },

  /**
   * Add a new model to the registry.
   *
   * @param Model
   */
  addModel (Model) {
    const key = ModelRegistry.getKeyFromModel (Model);

    if (!!this._models[key])
      return;

    // Put in a placeholder for the time being. This will prevent a model from
    // being processed multiple times.
    debug (`creating populator for ${key}`);

    this._models[key] = new RegistryItem ({ Model });
    this._models[key].populators = this._makePopulate (Model.db, Model.schema);
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

        populate[pathName] = new PopulateElement ({ Model, key, options: this.options});

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

          let populators = this._makePopulate (db, type);

          if (!isEmpty (populators))
            populate[pathName] = new PopulateEmbeddedArray ({ populators, options: this.options});
        }
        else if (type.ref) {
          // We have an array of document references.
          const Model = db.models[type.ref];
          const key = ModelRegistry.getKeyFromModel (Model);

          populate[pathName] = new PopulateArray ({Model, key, options: this.options});

          this.addModel (Model);
        }
      }
      else if (instance === 'Embedded') {
        let populators = this._makePopulate (db, path.schema);

        if (!isEmpty (populators))
          populate[pathName] = new PopulateEmbedded ({populators, options: this.options});
      }
    });

    return populate;
  }
});

ModelRegistry.getKeyFromModel = function (Model) {
  return Model.db.name + ':' + Model.modelName;
};

module.exports = ModelRegistry;
