var blueprint = require ('@onehilltech/blueprint')
  , winston   = require ('winston')
  , messaging = blueprint.messaging
  ;

var CloudToken;

messaging.once ('app.init', function (app) {
  CloudToken = app.models.CloudToken;
});

function createCloudTokenForAccount (account) {
  var reg = new CloudToken ({_id: account._id});

  reg.save (function (err) {
    if (err) winston.log ('error', util.inspect (err));
  });
}

module.exports = exports = createCloudTokenForAccount;