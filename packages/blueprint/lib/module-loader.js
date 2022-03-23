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

const { statSync } = require ('fs-extra');
const path   = require ('path');
const assert = require ('assert');
const { BO } = require ('base-object');
const ApplicationModule = require ('./application-module');
const Events = require ('./messaging/events');

const { forEach, find, isEmpty, map } = require ('lodash');
const { props } = require ('bluebird');

const debug = require ('debug') ('blueprint:module-loader');

const KEYWORD_BLUEPRINT_MODULE = 'blueprint-module';
const FILE_PACKAGE_JSON = 'package.json';

function isBlueprintModule (packageObj) {
  return packageObj.keywords && packageObj.keywords.indexOf (KEYWORD_BLUEPRINT_MODULE) !== -1;
}

/**
 * @class BlueprintModule
 *
 * A simple representation of a Blueprint module.
 */
class BlueprintModule {
  constructor (name, path) {
    this.name = name;
    this.path = path;
  }

  get appPath () {
    return path.resolve (this.path, 'app')
  }
}

/**
 * @class BlueprintModuleCollector
 *
 * A utility class that gathers Blueprint modules.
 */
class BlueprintModuleCollector {
  constructor (appPath) {
    this.appPath = appPath;
    this.modules = [];
    this._seen = {};
  }

  /**
   * Gather the collection of Blueprint modules for the given application path.
   *
   * @param appPath
   */
  async gather (appPath) {
    // First, locate all the modules that we need to load.
    const packageFile = path.resolve (appPath, '..', FILE_PACKAGE_JSON);
    const packageObj = require (packageFile);

    if (packageObj && packageObj.dependencies)
      await this._searchDependencies (packageObj.dependencies);

    return this.modules;
  }

  /**
   * Search the dependencies for Blueprint modules.
   * @param dependencies
   * @private
   */
  async _searchDependencies (dependencies) {
    if (isEmpty (dependencies))
      return;

    debug (`searching dependencies: ${Object.keys (dependencies)}`);

    const promises = map (dependencies, (version, name) => this._handleNodeModule (name, version));
    await props (promises);
  }

  /**
   * Handle processing a node module.
   *
   * @param name
   * @param version
   * @private
   */
  async _handleNodeModule (name, version) {
    // Do not process the module more than once.
    if (this._seen[name])
      return;

    // Open the package.json file for this node module, and determine
    // if the module is a Blueprint.js module.
    let modulePath;

    if (version.startsWith ('file:')) {
      // The file location is relative to the blueprint application.
      let relativePath = version.slice (5);
      modulePath = path.resolve (this.appPath, '..', relativePath);
    }
    else {
      modulePath = await this._resolveModulePath (name);
    }

    const packageFile = path.resolve (modulePath, FILE_PACKAGE_JSON);
    const packageObj = require (packageFile);

    // If the module is a Blueprint module, let's save it. We then need to
    // process the dependencies of the found Blueprint module.

    if (isBlueprintModule (packageObj) && !this._seen[name]) {
      this.modules.push (new BlueprintModule (name, modulePath));
      this._seen[name] = true;

      await this._searchDependencies (packageObj.dependencies);
    }
  }

  /**
   * Resolve the full location of the modules path.
   *
   * @param name
   * @private
   */
  async _resolveModulePath (name) {
    // Let's make sure the node_modules for the application appear on the path. This is
    // important for examples applications that reside within an existing application
    const paths = [path.resolve (this.appPath, '../node_modules'), ...module.paths];

    let basename = find (paths, basename => {
      let modulePath = path.resolve (basename, name, 'package.json');

      try {
        return statSync (modulePath).isFile ();
      }
      catch (err) {
        return false;
      }
    });

    if (!basename)
      throw new Error (`Cannot locate modules for ${name}`);

    return path.resolve (basename, name);
  }
}

/**
 * @class ModuleLoader
 *
 * Utility class for loading Blueprint modules into an application.
 */
module.exports = BO.extend (Events, {
  /// The target application for the loader.
  app: null,

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};

    assert (!!this.app, 'You must define the app property');
  },

  /**
   * Load the Blueprint modules in the application path.
   */
  async load () {
    // First, locate all the modules that we need to load.
    const collector = new BlueprintModuleCollector (this.app.appPath);
    const modules = await collector.gather (this.app.appPath);

    // Topologically sort the module by reversing the array. This will ensure
    // that we load the modules in correct order of dependency.
    modules.reverse ();

    // Load each module into memory.
    for (const blueprintModule of modules) {
      const module = new ApplicationModule ({app: this.app, name: blueprintModule.name, modulePath: blueprintModule.appPath});

      await this.emit ('loading', module);
      await module.configure ();
      await this.emit ('loaded', module);
    }
  },
});
