const ModelRegistry = require ('./model-registry');
const Population = require ('./Population');

const registry = new ModelRegistry ();

const {
  isArray
} = require ('lodash');

/**
 * Populate the data.
 *
 * @param data
 * @param Model
 */
function populate (data, Model) {
  // First, let's add this model to the global registry.
  registry.addModel (Model);

  // Now, let's create a population container that will be used to track
  // our current progress of populating the data. We are going to start
  // with the data for the root model element.
  let population = new Population ({registry});
  population.addModels (Model.modelName, data);

  let p = isArray (data) ?
    population.populateArray (key, data) :
    population.populateElement (key, data);

  return p.then (() => population.flatten ());
}

module.exports = populate;
