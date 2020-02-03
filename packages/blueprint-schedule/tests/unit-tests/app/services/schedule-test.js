const blueprint = require ('@onehilltech/blueprint');
const path = require ('path');
const fs = require ('fs-extra');

const { expect } = require ('chai');

describe ('app | services | schedule', function () {
  context ('#configure', function () {
    before (function () {
      // Delete the run if first time file.
      const pathFile = path.resolve (blueprint.app.tempPath, 'schedules');
      return fs.remove (pathFile);
    });

    it ('should load the schedule and create a job', function () {
      const schedule = blueprint.app.lookup ('service:schedule');

      expect (schedule.schedules).to.have.keys (['basic-schedule', 'run-if-first-time']);
      expect (schedule.jobs).to.have.keys (['basic-schedule', 'run-if-first-time']);
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

    it ('should run the schedule if the first time', function () {
      const pathName = path.resolve (blueprint.app.tempPath, 'schedules/run-if-first-time/last_time_run.date');
      expect (fs.pathExistsSync (pathName)).to.be.true;
    });
  });
});