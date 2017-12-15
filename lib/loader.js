const all    = require ('require-all');
const Object = require ('./object');
const _      = require ('lodash');
const path   = require ('path');
const fs     = require ('fs');
const assert = require ('assert');
const debug  = require ('debug') ('blueprint:require');
const Env    = require ('./environment');

function load (opts) {
  return new Promise ((resolve) => {
    fs.stat (opts.dirname, (err, stats) => {
      if (err || !stats.isDirectory ())
        return resolve ({});

      // Load all the objects in the directory.
      debug ('loading ' + opts.dirname);
      let objects = all (opts);

      resolve (objects);
    });
  });
}

module.exports = Object.extend ({
  /**
   * Run the loader.
   *
   * @param opts
   * @returns {Promise<[]>}
   */
  load (opts) {
    assert (!!opts.dirname, 'Your options must have a `dirname` property');

    let defaults = {
      excludeDirs: /^(env|\.(git|svn))$/,
      recursive: true
    };

    // Load the assets from the directory and from the environment directory,
    // if applicable. We need to list the loads in this order so that when we
    // merge, environment specific assets will take precedence.
    //

    let dirname = opts.dirname;
    let envPath = path.join (dirname, 'env', Env.name);

    let promises = [
      load (_.merge ({}, defaults, opts, {dirname})),
      load (_.merge ({}, defaults, opts, {dirname: envPath}))
    ];

    return Promise.all (promises).then (result => {
      let assets = _.merge ({}, ...result);
      return Promise.resolve (assets);
    });
  }
});
