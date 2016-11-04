var blueprint = require ('@onehilltech/blueprint')
  , async     = require ('async')
  , expect    = require ('chai').expect
  , appPath   = require ('../../../fixtures/appPath')
  , clearData = require ('../../../../lib/testing/clearData')
  , seed      = require ('../../../../lib/testing/seed')
  ;

describe ('lib.testing.seed', function () {
  before (function (done) {
    async.series ([
      function (callback) { blueprint.testing.createApplicationAndStart (appPath, callback); },
      function (callback) { clearData (callback) }
    ], done);
  });

  it ('should seed the database with data', function (done) {
    var data = {
      degrees: [
        { degree: 'PhD', major: 'Computer Science', school: 'Vanderbilt University' },
        { degree: 'MS', major: 'Computer Science', school: 'Vanderbilt University' },
        { degree: 'BS', major: 'Computer Science', school: 'Morehouse College' }
      ]
    };

    seed (data, function (err, models) {
      if (err) return done (err);

      expect (models.degrees).to.have.length (3);
      expect (models).to.have.deep.property ('degrees[0].degree', 'PhD');
      expect (models).to.have.deep.property ('degrees[1].degree', 'MS');
      expect (models).to.have.deep.property ('degrees[2].degree', 'BS');

      return done (null);
    });
  });
});
