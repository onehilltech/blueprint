'use strict';

let validator = require ('validator')
  , moment    = require ('moment')
  ;

module.exports = function (str) {
  if (str === undefined)
    return false;

  if (validator.isNumeric (str)) {
    let n = Number.parseInt (str);
    return moment (n).isValid ();
  }
  else if (validator.isJSON (str)) {
    let obj = JSON.parse (str);
    return moment (obj).isValid ();
  }
  else {
    return moment (str).isValid ();
  }
};
