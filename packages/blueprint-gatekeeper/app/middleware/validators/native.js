'use strict';

module.exports = {
  client_secret: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Missing client secret'
    }
  }
};

