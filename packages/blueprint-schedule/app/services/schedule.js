const { Service, computed, Loader } = require ('@onehilltech/blueprint');
const { forEach, mapValues } = require ('lodash');
const debug = require ('debug')('blueprint-schedule');
const path = require ('path');
const schedule = require ('node-schedule');
const bluebird = require ('bluebird');
const fs = require('fs-extra');
const LastTimeRunFile = require ('../../lib/last-time-run-file');

/**
 * @class schedule
 */
module.exports = Service.extend ({
  schedulesPath: computed ({
    get () {
      return path.resolve (this.app.appPath, 'schedules');
    }
  }),

  schedules: computed.readonly ('_schedules'),

  jobs: computed.readonly ('_jobs'),

  /// The loaded schedules.
  _schedules: null,

  /// The active jobs for the schedules.
  _jobs: null,

  /// Loader used to load schedules.
  _loader: null,

  init () {
    this._super.call (this, ...arguments);

    this._loader = new Loader ();

    this._schedules = {};
    this._jobs = {};
  },

  configure () {
    const schedulesPath = this.schedulesPath;

    return this._loader.load ({
      dirname: schedulesPath,
      resolve (Schedule) { return new Schedule () }
    }).then (schedules => this._schedules = schedules);
  },

  start () {
    let promises = mapValues (this._schedules, (sched, key) => {
      debug (`scheduling ${key}`);

      return Promise.resolve (sched.spec).then (spec => this._scheduleJob (key, sched, spec));
    });

    return bluebird.props (promises);
  },

  destroy () {
    // Cancel the loaded schedules in no particular order.
    forEach (this._jobs, (job, key) => this._cancelJob (key, job));
  },

  /**
   * Cancel a job.
   *
   * @param name            Name of the job.
   * @param reschedule      Optional reschedule specification
   */
  cancel (name, reschedule) {
    this._lookupJob (name).cancel (reschedule);
  },

  /**
   * Cancel the next schedule for the job
   *
   * @param name            Name of the job
   * @param reschedule      Optional reschedule specification
   */
  cancelNext (name, reschedule) {
    this._lookupJob (name).cancelNext (reschedule);
  },

  /**
   * Reschedule an existing job.
   *
   *
   * @param name            Name of the job
   * @param spec            Reschedule specification
   */
  reschedule (name, spec) {
    this._lookupJob (name).reschedule (spec);
  },

  /**
   * Get the next invocation of a job.
   *
   * @param name
   */
  nextInvocation (name) {
    return this._lookupJob (name).nextInvocation ();
  },

  _lookupJob (name) {
    let job = this._jobs[name];

    if (!!job)
      return job;

    throw new Error (`The job ${name} does not exist.`);
  },

  _scheduleJob (name, sched, spec) {
    // Schedule the job to run.
    let lastTimeRunFile = new LastTimeRunFile ({tempPath: this.app.tempPath, name});
    let job = schedule.scheduleJob (spec, (runAt) => this._run (name, sched, runAt, lastTimeRunFile));

    // Save the job.
    this._jobs[name] = job;

    job.on ('canceled', () => {
      sched.onCanceled ();
      this.app.emit ('blueprint.schedule.job.canceled', name, sched);
    });

    job.on ('scheduled', () => {
      sched.onScheduled ();
      this.app.emit ('blueprint.schedule.job.scheduled', name, sched);
    });


    if (sched.runIfFirstTime && !lastTimeRunFile.existsSync ())
      this._run (name, sched, new Date (), lastTimeRunFile);

    return job;
  },

  /**
   * Helper method that runs a schedule job.
   *
   * @param name
   * @param sched
   * @param runAt
   * @private
   */
  _run (name, sched, runAt, lastTimeRunFile) {
    try {
      // Notify all that the schedule is ready to run. Then, run the job. When the job
      // is done running, let the application know the job is done. If there is an error,
      // then we notify all that the job had an error.

      this.app.emit ('blueprint.schedule.job.run', name, sched);

      lastTimeRunFile.updateSync (runAt);
      sched.run (runAt);

      this.app.emit ('blueprint.schedule.job.done', name, sched);
    }
    catch (err) {
      this.app.emit ('blueprint.schedule.job.error', name, sched, err);
    }
  },

  _cancelJob (name, job) {
    debug (`canceling ${name}`);

    job.cancel ();
  }
});
