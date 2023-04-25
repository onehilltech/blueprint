const EmberApp = require ('./ember-app');

module.exports = function EmberRouter (spec = {}) {
  return { ...spec, use: EmberApp () };
};