var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  '/gatekeeper': blueprint.ModuleRouter ('@onehilltech/gatekeeper:v1')
};
