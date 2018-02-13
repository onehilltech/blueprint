const {
  Policy
} = require ('@onehilltech/blueprint');

module.exports = Policy.allSeries ([
  Policy.assert ('gatekeeper.auth.bearer'),
  Policy.assert ('gatekeeper.request.isFromClient')
]);
