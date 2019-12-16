const { Service, computed, Loader } = require ('@onehilltech/blueprint');
const { forEach, mapValues } = require ('lodash');
const debug = require ('debug')('blueprint-schedule');
const path = require ('path');
const schedule = require ('node-schedule');
const bluebird = require ('bluebird');

function scheduleRunner (schedule) {
  return function (runAt) {
    schedule.run (runAt);
  }
}

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

      return Promise.resolve (sched.spec)
        .then (spec => schedule.scheduleJob (spec, scheduleRunner (sched)))
        .then (job => this._jobs[key] = job);
    });

    return bluebird.props (promises);
  },

  destroy () {
    // Cancel the loaded schedules in no particular order.
    forEach (this._jobs, (job, key) => {
      debug (`canceling ${key}`);

      job.cancel ();
    });
  }
});
