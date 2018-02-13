const blueprint = require ('@onehilltech/blueprint');
const Sender    = require ('../../../lib/Sender');

describe ('lib | Sender', function () {
  let Model = {
    populate () {
      return this;
    },

    exec (callback) {
      return callback (null, [
        {client: { enabled: true}}
      ]);
    }
  };

  let mockCloudToken = {
    find () {
      return Model;
    }
  };

  describe ('send', function () {
    it ('should send a data message', function (done) {
      let sender = new Sender (mockCloudToken, {apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      let recipient = blueprint.app.seeds.$default.accounts[0].id;

      sender.send ([recipient], {msg: 'Hello, World!'}, done);
    });
  });

  describe ('publish', function () {
    it ('should send a data message', function (done) {
      let sender = new Sender (mockCloudToken, {apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      let topic = '/topics/foo-bar';

      sender.publish (topic, {msg: 'Hello, World!'}, done);
    });
  });
});