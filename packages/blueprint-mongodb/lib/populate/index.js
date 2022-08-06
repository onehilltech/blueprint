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

const ModelRegistry = require ('./model-registry');
const Population = require ('./population');
const { reduce, omit, isEmpty } = require ('lodash');

function getModel (model) {
  let modelName = model.constructor.modelName;
  return model.db.models[modelName];
}

/**
 * Helper function that compacts the models by remove empty entries.
 *
 * @param models
 */
function compact (models) {
  const omittable = reduce (models, (result, value, key) => {
    if (isEmpty (value))
      result.push (key);

    return result;
  }, []);

  return omit (models, omittable);
}

/**
 * Populate a model.
 *
 * @param   model       Model to populate.
 * @param   options
 * @return  Promise <Population>
 */
async function populateModel (model, options = {}) {
  // Get the registered model type.
  const Model = getModel (model);

  // Create a new register, and add the root Model to it.
  const registry = new ModelRegistry ({ options });
  registry.addModel (Model);

  // Create a new population for this registry. Then, add the
  // root model to the population.
  const population = new Population ({registry, options});
  const result = await population.addModel (model);

  return compact (result.models);
}

/**
 * Populate an array of models.
 *
 * @param models
 * @param options
 */
async function populateModels (models, options = {}) {
  const registry = new ModelRegistry ({ options });

  // Add the model types to the registry.
  models.forEach (model => {
    const Model = getModel (model);
    registry.addModel (Model);
  });

  // Create a new population for this registry. Then, add the
  // root model to the population.
  const population = new Population ({registry, options});
  const result = await population.addModels (models);

  return compact (result.models);
}

exports.populateModel = populateModel;
exports.populateModels = populateModels;
