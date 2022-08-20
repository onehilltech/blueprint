/**
 * Main entry point for the module.
 *
 * @param app
 */
module.exports = function (app) {
  app.defineType ('actor', { location: 'actors' });
}
