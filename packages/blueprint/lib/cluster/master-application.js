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

const { BO, computed } = require ('base-object');
const path = require ('path');

/**
 * @class MasterApplication
 *
 * The master application in the cluster. The master application is responsible
 * for communicating with the worker applications.
 *
 * Right now, we do not coordinate the startup sequence. This allows each worker
 * to run at its own pace.
 */
module.exports = BO.extend ({
  appPath: null,

  messaging: null,

  tempPath: computed ({
    get () { return path.resolve (this.appPath, `.blueprint/${process.pid}`); }
  }),

  configure () {
    return Promise.resolve (this);
  },

  start () {
    return Promise.resolve (this);
  },

  restart () {
    return Promise.resolve (this);
  },

  destroy () {
    return Promise.resolve (this);
  }
});
