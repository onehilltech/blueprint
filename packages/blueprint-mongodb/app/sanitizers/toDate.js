'use strict';

let moment    = require ('moment')
  , validator = require ('validator')
  ;

module.exports = function (str) {
  if (str === undefined || str === null)
    return str;

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
