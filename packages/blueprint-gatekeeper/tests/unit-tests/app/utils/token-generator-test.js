const expect       = require ('chai').expect
  , TokenGenerator = require ('../../../../app/utils/token-generator')
  ;

describe ('app | utils | TokenGenerator', function () {
  context ('create', function () {
    it ('should create a token generator', function () {
      let tg = new TokenGenerator ();

      expect (tg).to.have.deep.property ('options', {algorithm: 'RS256', expiresIn: '1h', issuer: 'gatekeeper'});
    });

  });

  context ('generateToken', function () {
    it ('should generate a token', function () {
      let tg = new TokenGenerator ();
      let token = tg.generateToken ({name: 'James Hill'});
      expect (token).to.exist;
    });
  });

  context ('verifyToken', function () {
    it ('should verify a generated token', function () {
      let tg = new TokenGenerator ();
      let payload = {name: 'James Hill'};

      let token = tg.generateToken (payload);
      let decoded = tg.verifyToken (token);

      expect (decoded).to.deep.include (payload);
    });
  });
});
