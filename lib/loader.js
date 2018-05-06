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

const all    = require ('require-all');
const { BO } = require ('base-object');
const _      = require ('lodash');
const path   = require ('path');
const fs     = require ('fs');
const assert = require ('assert');
const {env}    = require ('./environment');

function load (opts) {
  return new Promise ((resolve) => {
    fs.stat (opts.dirname, (err, stats) => {
      if (err || !stats.isDirectory ())
        return resolve ({});

      // Load all the objects in the directory.
      let objects = all (opts);

      resolve (objects);
    });
  });
}

/**
 * @class Loader
 *
 * Utility class for loading entities from a directory.
 */
module.exports = BO.extend ({
  /**
   * Run the loader.
   *
   * @param opts
   * @returns {Promise<[]>}
   */
  load (opts) {
    assert (!!opts.dirname, 'Your options must have a `dirname` property');

    // By default, we only want files that end in .js, and do not
    // start with dash (-).
    let defaults = {
      excludeDirs: /^(env|\.(git|svn))$/,
      recursive: true,
      filter: /^(?!-)(.+)\.js$/
    };

    // Load the assets from the directory and from the environment directory,
    // if applicable. We need to list the loads in this order so that when we
    // merge, environment specific assets will take precedence.
    //

    let dirname = opts.dirname;
    let envPath = path.join (dirname, 'env', env);

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
