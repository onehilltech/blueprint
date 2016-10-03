var async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , Sender    = require ('../../../lib/Sender')
  ;

var datamodel  = require ('../../fixtures/datamodel')
  ;

describe ('Sender', function () {
  var mockCloudToken = {
    distinct : function (field, filter, callback) {
      return callback (null, ['1']);
    }
  };

  before (function (done) {
    datamodel.apply (done);
  });

  describe ('.send', function () {
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should send a data message', function (done) {
      var sender = new Sender (mockCloudToken, {apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      var recipient = datamodel.models.accounts[0]._id;

      sender.send ([recipient], {msg: 'Hello, World!'}, done);
    });
  });

  describe ('.publish', function () {
    var data = {device: '1234567890', token: 'aabbccdd'};

    it ('should send a data message', function (done) {
      var sender = new Sender (mockCloudToken, {apiKey: 'AIzaSyDuhZ8sT_ziDTm3SWAaunU2rRnR951eRDE', dryRun: true});
      var topic = '/topics/foo-bar';

      sender.publish (topic, {msg: 'Hello, World!'}, done);
    });
  });

});