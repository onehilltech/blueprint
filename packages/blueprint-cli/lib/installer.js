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

const npm              = require ('npm');
const { BO }           = require ('base-object');
const { fromCallback } = require ('bluebird');

/**
 * @class Installer
 */
const Installer = BO.extend ({
  install (depends) {
    return fromCallback (callback => this.npm.commands.install (depends, callback));
  },

  uninstall (depends) {
    return fromCallback (callback => this.npm.commands.uninstall (depends, callback));
  },

  prune () {
    return fromCallback (callback => this.npm.commands.prune (callback));
  },

  bin () {
    return fromCallback (callback => this.npm.commands.bin (callback));
  }
});

module.exports = function (targetPath, config) {
  config.prefix = targetPath;

  return fromCallback (callback => npm.load (config, callback))
    .then (npm => new Installer ({npm}));
};
