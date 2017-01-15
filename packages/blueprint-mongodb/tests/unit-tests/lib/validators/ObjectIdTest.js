const expect  = require ('chai').expect
  , validator = require ('../../../../lib/validators/ObjectID')
  ;

describe ('lib.validators.ObjectId', function () {
  it ('should return a schema for validating an ObjectID', function () {
    var schema = validator ({});

    expect (schema).to.deep.equal ({
      isMongoId: {
        errorMessage: 'Invalid/missing ObjectID'
      }
    });
  })
});