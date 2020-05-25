const { isArray, uniqBy } = require ('lodash');

function flatten (result, src, srcKey, dst, dstId) {
  // Create an empty array that we are separating the items into.
  if (!result[dst])
    result[dst] = [];

  if (isArray (result[src]))
    result[src] = flatten_array (result, src, srcKey, dst, dstId);
  else
    result[src] = flatten_object (result, src, srcKey, dst, dstId);
}

function flatten_array (data, src, srcKey, dst, dstId) {
  let result = data[src].map (model => {
    // We may be working with a top-level model. We need to get the
    // raw json model for our purposes.
    let json = model.toJSON ? model.toJSON () : model;

    if (!!json[srcKey]) {
      // Move the child from the parent to a top-level collection.
      let child = json[srcKey];
      data[dst].push (child);

      delete json[srcKey];
    }

    return json;
  });

  // Lastly, make sure to remove all duplicate items from the destination
  // list we just created.

  if (!!dstId) {
    data[dst] = uniqBy (data[dst], dstId);
  }

  return result;
}

function flatten_object (data, src, srcKey, dst, dstId) {
  let model = data[src];

  // We may be working with a top-level model. We need to get the
  // raw json model for our purposes.
  let json = model.toJSON ? model.toJSON () : model;

  if (!!json[srcKey]) {
    // Move the child from the parent to a top-level collection.
    let child = json[srcKey];
    data[dst].push (child);

    delete json[srcKey];
  }

  // Lastly, make sure to remove all duplicate items from the destination
  // list we just created.

  if (!!dstId) {
    data[dst] = uniqBy (data[dst], dstId);
  }

  return json;
}

module.exports = flatten;
