'use strict';

var async    = require ('async')
  , hasScope = require ('./has_scope')
  ;

function isSuperuser (req, callback) {
  return hasScope ('*', req, function (err, result) {
    if (result)
      req.superuser = true;

    return callback (err, result);
  });
}

module.exports = isSuperuser;
