var gatekeeper = require ('@onehilltech/gatekeeper')
  ;

module.exports = exports = {
  '/gatekeeper': gatekeeper.blueprint.Router ('gatekeeper', 1)
};
