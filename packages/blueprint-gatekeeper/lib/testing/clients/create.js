var async = require ('async')
  , _ = require ('underscore')
  , Client = require ('../../../app/models/Client')
  ;

function createClients (num, opts, callback) {
  if (!callback) {
    callback = opts;
    opts = undefined;
  }

  opts = opts || {};
  opts = _.defaults (opts, {firstId: 1, roles:[], enabled: true});

  var firstId = opts.firstId;
  var scope = opts.scope;
  var enabled = opts.enabled;

  function onComplete (err, clients) {
    if (err) return callback (err);
    return Client.create (clients, callback);
  }

  async.times (num, function (id, callback) {
    var myId = firstId + id;

    var name = 'client' + myId;
    var email = 'contact@' + name + '.com';
    var secret = name;
    var redirect = 'https://' + name + '.com/gatekeeper';

    var client = {
      name: name,
      email: email,
      secret: secret,
      redirect_uri: redirect,
      scope: scope,
      enabled : enabled
    };

    return callback (null, client);
  }, onComplete);
}

exports = module.exports = createClients;
