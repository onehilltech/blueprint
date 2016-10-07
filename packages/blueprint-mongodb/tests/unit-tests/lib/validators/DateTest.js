const expect  = require ('chai').expect
  , validator = require ('../../../../lib/validators/Date')
  ;

describe ('validator.Date', function () {
  it ('should return the default schema for a Date', function () {
    var schema = validator ({options: {}});
    expect (schema).to.deep.equal ({
      isDate: {
        errorMessage: 'Invalid date format'
      }
    });

    schema = validator ({options: {validation: {}}});
    expect (schema).to.deep.equal ({
      isDate: {
        errorMessage: 'Invalid date format'
      }
    });
  });

  it ('should return a schema for validating a Number date', function () {
    var options = {options: {validation: {kind: 'Numeric'}}};
    var schema = validator (options);

    expect (schema).to.deep.equal ({
      isNumeric: {
        errorMessage: 'Invalid numeric date'
      }
    });
  });
});