'use strict';

var async    = require ('async')
  , hasScope = require ('./request/hasScope')
  ;

function isSuperuser (req, callback) {
  return hasScope ('*', req, function (err, result) {
    if (result)
      req.superuser = true;

    return callback (err, result, 'Not a super user');
  });
}

module.exports = isSuperuser;
