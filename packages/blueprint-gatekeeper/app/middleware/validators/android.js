'use strict';

const _    = require ('underscore')
  , native = require ('./native')
  ;

module.exports = _.extend ({
  package: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Missing package value'
    }
  }
}, native);
