const toMongoId = require ('../../../../app/sanitizers/toMongoId');
const { expect } = require ('chai');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

describe ('app | sanitizers | toMongoId', function () {
  it ('should convert a string to a MongoId', function () {
    let expected = new ObjectId ();
    let id = toMongoId (expected.toString ());

    expect (expected).to.eql (id);
  });
});
