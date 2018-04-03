const supertest = require ('supertest');
const blueprint = require ('@onehilltech/blueprint');

/**
 * Make a test request. If no Express.js application is provided, then
 * the request is sent to the current Blueprint.js application.
 *
 * @param app     Optional application
 *
 * @returns {Test}
 */
function request (app) {
  app = app || blueprint.app.server.express;
  return supertest (app);
}

module.exports = request;
