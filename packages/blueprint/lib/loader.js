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
const { merge } = require ('lodash');
const path   = require ('path');
const fs     = require ('fs').promises;
const assert = require ('assert');
const { env }  = require ('./environment');
const debug  = require ('debug') ('blueprint:loader');

async function load (opts) {
  debug (`loading resources in ${opts.dirname}`);

  try {
    const stats = await fs.stat (opts.dirname);
    return stats.isDirectory () ? all (opts) : {};
  }
  catch (err) {
    // If the error is that the directory does not exist, then we just return
    // an empty hash. This is because we are not expecting all deployments of
    // blueprint to have all directories.

    if (err && err.code === 'ENOENT')
      return {};

    throw err;
  }
}

/**
 * @class Loader
 *
 * Utility class for loading entities from a directory.
 */
module.exports = class Loader {
  /**
   * Run the loader.
   *
   * @param opts
   * @returns {Promise<[]>}
   */
  async load (opts) {
    assert (!!opts.dirname, 'Your options must have a `dirname` property');

    // By default, we only want files that end in .js, and do not
    // start with dash (-).
    const defaults = {
      excludeDirs: /^(env|\.(git|svn))$/,
      recursive: true,
      filter: /^(?!-)(.+)\.js$/
    };

    // Load the assets from the directory and from the environment directory,
    // if applicable. We need to list the loads in this order so that when we
    // merge, environment specific assets will take precedence.

    const dirname = opts.dirname;
    const envPath = path.join (dirname, 'env', env);

    const results = await Promise.all ([
      load (merge ({}, defaults, opts, {dirname})),
      load (merge ({}, defaults, opts, {dirname: envPath}))
    ]);

    return merge ({}, ...results);
  }
}
