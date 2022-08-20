/**
 * Main entry point for the module.
 *
 * @param module
 */
module.exports = function (module) {
  module.app.defineType('actor', { location: 'actors' });
};