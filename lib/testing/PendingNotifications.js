/**
 * Counts the number of pending notifications. When there are no more pending notifications,
 * then the done () function is called.
 *
 * @param count
 * @constructor
 */
function PendingNotifications (count) {
  this.count = count;
  this.current = 0;
}

/**
 * Log that a notification has been received. If the are no more notifications,
 * then the done () function is called.
 *
 * @param done
 * @returns {*}
 */
PendingNotifications.prototype.notify = function notify (done) {
  ++ this.current;

  if (this.current === this.count)
    return done ();
};

module.exports = exports = PendingNotifications;
