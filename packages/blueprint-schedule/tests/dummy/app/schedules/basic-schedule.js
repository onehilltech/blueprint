const { Schedule } = require ('../../../../lib');

module.exports = Schedule.extend ({
  spec: '30 * * * * *',

  run () {
    console.log ('We are alive!!')
  }
});
