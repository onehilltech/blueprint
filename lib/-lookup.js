const {
  plural
} = require('pluralize');

const {
  get
} = require ('object-path');

module.exports = function (resources, component) {
  const [type,name] = component.split (':');
  const types = plural (type);
  const entities = resources[types];

  if (!entities)
    throw new Error (`${type} is not a valid type`);

  let entity = get (entities, name);

  if (!entity)
    throw new Error (`${component} does not exist`);

  return entity;
};
