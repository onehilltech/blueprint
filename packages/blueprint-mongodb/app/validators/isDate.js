'use strict';

let validator = require ('validator')
  , moment    = require ('moment')
;

module.exports = function (value, opts) {
  if (value === undefined || value === null)
    return false;

  opts = opts || {};
  let m = null;

  if (validator.isNumeric (value)) {
    let n = Number.parseInt (value);
    m = moment (n);
  }
  else if (validator.isJSON (value)) {
    let obj = JSON.parse (value);
    m = moment (obj);
  }
  else {
    if (opts.format) {
      switch (opts.format) {
        case 'utc':
          m = moment.utc (value);
          break;

        case 'seconds':
          m = moment.unix (value);
          break;

        default:
          throw new Error (`Unknown format: ${opts.format}`);
      }
    }
    else {
      m = moment (value);
    }
  }

  return m.isValid ();
};
