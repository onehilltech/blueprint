'use strict';

module.exports = {
  '/errors': {
    '/blueprint': {
      get: { action: 'ErrorController@blueprintError' }
    },

    '/http': {
      get: { action: 'ErrorController@httpError' }
    }
  }
};