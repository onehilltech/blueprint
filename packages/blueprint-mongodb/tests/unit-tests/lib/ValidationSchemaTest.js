const expect  = require ('chai').expect
  , validator = require ('validator')
  , lib = require ('../../../lib')
  , ValidationSchema = require ('../../../lib/ValidationSchema')
  ;

describe ('ValidationSchema', function () {
  it ('should create a validation schema', function () {
    var schema = new lib.Schema ({
      name: {
        first: {type: String, required: true},
        middle: {type: String},
        last: {type: String, required: true, validation: {optional: true}}
      },
      sex: {type: String, required: true, enum: ['male', 'female']},
      age: {type: Number, validation: { kind: 'Int'}}
    });

    var validation = ValidationSchema (schema);

    expect (validation).to.eql ({
      _id: {
        isMongoId: { errorMessage: 'Invalid/missing ObjectID' },
        optional: true
      },

      'name.first': {
        notEmpty: true
      },
      'name.middle': {
        optional: true,
        notEmpty: true
      },
      'name.last': {
        notEmpty: true,
        optional: true
      },

      age: {
        optional: true,
        isInt: {
          errorMessage: 'Invalid/missing Int'
        }
      },

      sex: {
        isIn: {
          errorMessage:  "Expected [ 'male', 'female' ]",
          options: [['male', 'female']]
        },
        notEmpty: true
      }
    });
  });
});
