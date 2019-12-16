const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('app | services | schedule', function () {
  context ('#configure', function () {
    it ('should load the schedule and create a job', function () {
      const schedule = blueprint.app.lookup ('service:schedule');

      expect (schedule.schedules).to.have.keys (['basic-schedule']);
      expect (schedule.jobs).to.have.keys (['basic-schedule']);
    });

    it ('should invoke the schedule lifecycle methods', function (done) {
      const schedule = blueprint.app.lookup ('service:schedule');
      const basicSchedule = schedule.schedules['basic-schedule'];

      setTimeout (() => {
        expect (basicSchedule.didRun).to.be.true;
        expect (basicSchedule.didSchedule).to.be.true;

        done ();
      }, 1000);
    });
  });
});