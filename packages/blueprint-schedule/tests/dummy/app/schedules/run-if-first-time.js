const { Schedule } = require ('../../../../lib');

module.exports = Schedule.extend ({
  spec: '* * * * * *',

  runIfFirstTime: true,

  run () {
    this.didRun = true;
  },

  onScheduled () {
    this.didSchedule = true;
  },

  onCanceled () {
    this.didCancel = true;
  }
});
