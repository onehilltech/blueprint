const expect = require ('chai').expect
  , AccessTokenGenerator = require ('../../../../app/utils/access-token-generator')
  ;

describe ('app | utils | AccessTokenGenerator', function () {
  context ('create', function () {
    it ('should create an access token generator', function () {
      let generator = new AccessTokenGenerator ();

      expect (generator).to.have.deep.property ('options', {algorithm: 'RS256', expiresIn: '1h', issuer: 'gatekeeper', subject: 'access-token'});
    });
  });
});
