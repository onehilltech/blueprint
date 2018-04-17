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

const dab = require ('@onehilltech/dab');
const path = require ('path');

const {
  barrier,
  Listener,
  Loader
} = require ('@onehilltech/blueprint');

const debug = require ('debug')('blueprint:modules:mongodb');
const all = require ('require-all');

const SEEDS_RELATIVE_PATH = 'seeds/mongodb';

/**
 * This listener is responsible for seeding the database after the
 * connections are open.
 */
module.exports = Listener.extend ({
  _loader: new Loader (),

  init () {
    this._super.call (this, ...arguments);
    //this._appStart = barrier ('blueprint.app.start', this);
  },

  handleEvent () {
    debug ('seeding the database connections');
    this.app.emit ('mongodb.seed.start');

    return this._readSeedFiles ().then (seeds => {

    }).then (seeds => {

    }).then (() => {
      return this.app.emit ('mongodb.seed.end');
    }).catch (err => {
      return this.app.emit ('mongodb.seed.failed', err);
    });
  },

  _readSeedFiles () {
    const dirname = path.resolve (this.app.appPath, SEEDS_RELATIVE_PATH);
    return this._loader.load ({dirname});
  }
});
