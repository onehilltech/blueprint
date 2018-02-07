const ClientToken = require ('../../models/ClientToken');

function createToken (req, callback) {
  const {client} = req;
  const origin = req.get ('origin');

  const doc = {
    client: client._id,
    scope : client.scope,
    origin
  };

  ClientToken.create (doc, callback);
}

module.exports = {
  createToken
};
