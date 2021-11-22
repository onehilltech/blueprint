const Migration = require ('../../../../../../lib/migration');

module.exports = Migration.extend ({
  prepare () {
    console.log ('*** preparing the migration ***');
  },

  migrate () {
    console.log ('*** running the migration ***');
  },

  finalize () {
    console.log ('*** finalize the migration ***');
  }
});
