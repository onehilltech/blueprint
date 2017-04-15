'use strict';

const _    = require ('underscore')
  , native = require ('./native')
  ;

module.exports = _.extend (_.clone (native), {
  package: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Missing package value'
    }
  }
});
