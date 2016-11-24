'use strict';

module.exports = initSocketIO;

function initSocketIO (app) {
  require ('../../../lib') (app.server.protocols);
}
