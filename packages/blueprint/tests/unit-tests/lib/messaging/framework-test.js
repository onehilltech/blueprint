const MessagingFramework = require ('../../../../lib/messaging/framework');
const expect = require ('chai').expect;

describe ('lib | messaging | MessagingFramework', function () {
  describe ('create()', function () {
    it ('should create a MessagingFramework object', function () {
      let framework = new MessagingFramework ();

      expect (framework).to.have.property ('messengers').to.have.key ('_');
    });
  });

  describe ('lookup()', function () {
    it ('should lookup an known messenger', function () {
      let framework = new MessagingFramework ();
      let messenger = framework.lookup ('_');

      expect (messenger).to.have.property ('key', '_');
      expect (framework.messengers).to.have.keys ('_');
    });

    it ('should lookup an unknown messenger', function () {
      let framework = new MessagingFramework ();
      let messenger = framework.lookup ('$');

      expect (messenger).to.have.property ('key', '$');
      expect (framework.messengers).to.have.keys ('_', '$');
    });
  })
});
