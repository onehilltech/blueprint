'use strict';

var passport = require ('passport')
  ;

function protect () {
  return passport.authenticate ('bearer', {session: false});
}

module.exports = protect;
