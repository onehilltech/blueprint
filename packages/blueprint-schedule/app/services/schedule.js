const { Service, computed, Loader } = require ('@onehilltech/blueprint');
const { forEach, mapValues } = require ('lodash');
const debug = require ('debug')('blueprint-schedule');
const path = require ('path');
const schedule = require ('node-schedule');
const bluebird = require ('bluebird');

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
    let job = schedule.scheduleJob (spec, (runAt) => sched.run (runAt));
    this._jobs[name] = job;

    job.on ('canceled', () => sched.onCanceled ());
    job.on ('scheduled', () => sched.onScheduled ());

    return job;
  },

  _cancelJob (name, job) {
    debug (`canceling ${name}`);

    job.cancel ();
  }
});
