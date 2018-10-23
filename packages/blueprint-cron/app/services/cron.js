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

const debug = require ('debug')('blueprint-cron');

const {
  Service,
  computed,
  Loader
} = require ('@onehilltech/blueprint');

const path = require ('path');

const {
  forOwn
} = require ('lodash');

/**
 * @class cron
 */
module.exports = Service.extend ({
  cronJobsPath: computed ({
    get () { return path.resolve (this.app.appPath, 'cronjobs'); }
  }),

  /// The collection of jobs managed by this service.
  _jobs: null,

  configure () {
    const loader = new Loader ();

    const opts = {
      dirname: this.cronJobsPath,
      resolve (Job) {
        return Job.create ({ app: this.app });
      }
    };

    return loader.load (opts).then (jobs => {
      this._jobs = jobs;
    });
  },

  start () {
    forOwn (this._jobs, (job, name) => {
      debug (`starting cron job ${name}`);

      job.start ();
    });
  },

  destroy () {
    forOwn (this._jobs, (job, name) => {
      debug (`stopping cron job ${name}`);

      job.stop ();
    });
  }
});
