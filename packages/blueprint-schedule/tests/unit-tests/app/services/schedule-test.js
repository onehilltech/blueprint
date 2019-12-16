const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('app | services | schedule', function () {
  context ('#configure', function () {
    it ('should load the schedule and create a job', function () {
      const schedule = blueprint.app.lookup ('service:schedule');

      expect (schedule.schedules).to.have.keys (['basic-schedule']);
      expect (schedule.jobs).to.have.keys (['basic-schedule']);
    });
  });
});