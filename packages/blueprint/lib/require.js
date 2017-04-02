'use strict';

const all  = require ('require-all')
  , extend = require ('extend')
  , path   = require ('path')
  , fs     = require ('fs')
  , debug  = require ('debug') ('blueprint:require')
  , Env    = require ('./Environment')
  ;

module.exports = function (opts, includeEnv, callback) {
  // Load all the objects in the directory.
  debug ('loading ' + opts.dirname);
  var objects = all (opts);

  if (!includeEnv)
    return callback (null, objects);

  // Load the objects for the target environment. Then, extend the previous
  // objects with the objects for the target environment.
  const envPath = path.join (opts.dirname, Env.name);

  fs.stat (envPath, function (err, stats) {
    if (err || !stats.isDirectory ())
      return callback (null, objects);

    const envOpts = _.extend (_.clone (opts), {dirname: envPath});

    debug ('loading ' + envOpts.dirname);
    const envObjects = all (envOpts);

    // Extend the default objects with the ones loaded from the environment
    // specific directory. The environment objects will overwrite the default
    // objects.
    objects = extend (true, objects, envObjects);
    return callback (null, objects);
  });
};
