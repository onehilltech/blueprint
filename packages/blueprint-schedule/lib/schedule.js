const { BO } = require ('@onehilltech/blueprint');

/**
 * @class Schedule
 *
 * The base class for all schedule objects.
 */
module.exports = BO.extend ({
  /**
   * Get the schedule specification. For model details on what constitutes a job schedule
   * specification, please see:
   *
   *   https://github.com/node-schedule/node-schedule#jobs-and-scheduling
   *
   * This method can return a Promise, if the specification is derived from something that
   * is computed asynchronously.
   */
  spec: null,

  /// Run the schedule when the service starts if it is the first time it has
  /// ever been run.
  runIfFirstTime: false,

  /**
   * Method called when the scheduled job is run.
   *
   * @param       runAt        The actual time the job is run.
   */
  run (runAt) {

  },

  /// Notification the task has been scheduled.
  onScheduled () {

  },

  /// Notification the task has been canceled.
  onCanceled () {

  }
});