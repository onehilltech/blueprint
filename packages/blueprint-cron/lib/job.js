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

const { BO, computed } = require ('@onehilltech/blueprint');
const { CronJob } = require ('cron');

/**
 * @class Job
 *
 * The base class for all cron jobs.
 */
module.exports = BO.extend ({
  time: null,

  startNow: false,

  timeZone: null,

  runOnInit: false,

  utcOffset: null,

  /// The actual cron job implementation.
  _job: null,

  init () {
    this._super.call (this, ...arguments);

    if (!this.time)
      throw new Error ('The cron job must define the time property.');

    this._job = new CronJob (this.time,
                             this.onTick.bind (this),
                             this.onComplete.bind (this),
                             this.startNow,
                             this.timeZone,
                             this.runOnInit,
                             this.utcOffset,
                             this.unrefTimeout);
  },

  /**
   * Start the job.
   */
  start () {
    return this._job.start ();
  },

  /**
   * Stop current execution of the job.
   */
  stop () {
    return this._job.stop ();
  },

  /**
   * The main entry point for the job.
   *
   * This method is called each time the service is ready to execute the job. The onTick()
   * method
   *takes an option complete parameter, which can be called after the job is complete.
   */
  onTick (complete) {

  },

  /**
   * The job has stopped.
   *
   * This method is called in response to calling the stop() method on the job, of the
   * onTick() method calling complete.
   */
  onComplete () {

  },

  /**
   * Set a new time for the task.
   *
   * @param time
   */
  setTime (time) {
    this._job.setTime (time);
  },

  /**
   * Get the last date for the job.
   */
  lastDate: computed ({
    get () { return this._job.lastDate (); }
  }),

  /**
   * Get the next date for the job.
   */
  nextDate: computed ({
    get () { return this._job.nextDate (); }
  }),

  /**
   * Get the next dates for the job.
   *
   * @param i
   * @return {*}
   */
  nextDates (i) {
    return this._job.nextDates (i);
  }
});
