'use strict';

var supertest = require ('supertest')
  , Framework = require ('../../lib/Framework')
  ;

/**
 * Make a test request. If no Express.js application is provided, then
 * the request is sent to the current Blueprint.js application.
 *
 * @param app     Optional application
 *
 * @returns {Test}
 */
function request (app) {
  app = app || Framework.app.server.app;
  return supertest (app);
}

module.exports = request;
