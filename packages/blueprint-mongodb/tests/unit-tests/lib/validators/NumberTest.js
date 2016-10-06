const expect  = require ('chai').expect
  , validator = require ('../../../../lib/validators/Number')
  ;

describe ('validator.Number', function () {
  it ('should return the default schema for a Number', function () {
    var schema = validator ({options: {}});
    expect (schema).to.deep.equal ({});

    schema = validator ({options: {validation: {}}});
    expect (schema).to.deep.equal ({});
  });

  it ('should return a schema for validating a type of Number', function () {
    var options = {options: {validation: {kind: 'Float'}}};
    var schema = validator (options);

    expect (schema).to.deep.equal ({
      isFloat: {
        errorMessage: 'Invalid/missing Float'
      }
    });
  });

  it ('should fail because of unsupported kind', function () {
    var options = {options: {validation: {kind: 'Bar'}}};
    expect (validator.bind (validator, options)).to.throw ('Invalid number kind: Bar');
  });
});