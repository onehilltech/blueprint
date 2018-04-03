const ModelRegistry = require ('./model-registry');
const Population = require ('./Population');

const {
  isArray
} = require ('lodash');

function getModel (model) {
  let name = model.constructor.modelName;
  return model.db.models[name];
}

/**
 * Populate a model.
 *
 * @param   model       Model to populate.
 * @return  Promise <Population>
 */
function populateModel (model) {
  // Get the registered model type.
  const Model = getModel (model);

  // Create a new register, and add the root Model to it.
  const registry = new ModelRegistry ();
  registry.addModel (Model);

  // Create a new population for this registry. Then, add the
  // root model to the population.
  const population = new Population ({registry});
  return population.addModel (model).then (population => population.models);
}

/**
 * Populate an array of models.
 *
 * @param models
 */
function populateModels (models) {
  const registry = new ModelRegistry ();

  // Add the model types to the registry.
  models.forEach (model => {
    const Model = getModel (model);
    registry.addModel (Model);
  });

  // Create a new population for this registry. Then, add the
  // root model to the population.
  const population = new Population ({registry});
  return population.addModels (models).then (population => population.models);
}

exports.populateModel = populateModel;
exports.populateModels = populateModels;
