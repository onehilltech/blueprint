var async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var datamodel  = require ('../../fixtures/datamodel')
  ;

describe ('Sender', function () {
  var Sender;

  before (function (done) {
    async.series ([
      function (callback) { datamodel.apply (callback); },
      function (callback) {
        Sender = require ('../../../lib/Sender');
        return callback ();
      }
    ], done);
  });

  describe ('.send', function () {
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should send a data message', function (done) {
      var sender = new Sender ({apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      var recipient = datamodel.models.accounts[0]._id;

      sender.send ([recipient], {msg: 'Hello, World!'}, done);
    });
  });

  describe ('.publish', function () {
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should send a data message', function (done) {
      var sender = new Sender ({apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      var topic = '/topics/foo-bar';

      sender.publish (topic, {msg: 'Hello, World!'}, done);
    });
  });

});