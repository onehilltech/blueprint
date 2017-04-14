'use strict';

module.exports = {
  recaptcha: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Missing recaptcha value'
    }
  }
};
