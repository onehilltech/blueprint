const { Action, service } = require ('@onehilltech/blueprint');

module.exports = Action.extend ({
  stripe: service ()
});
