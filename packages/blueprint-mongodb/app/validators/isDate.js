const {
  isNumeric,
  isJSON
} = require ('validator');

const {
  parse
} = JSON;

const moment = require ('moment');

module.exports = function (value, opts = {}) {
  if (value === undefined || value === null)
    return false;

  let m = null;

  if (isNumeric (value)) {
    let n = parseInt (value);
    m = moment (n);
  }
  else if (isJSON (value)) {
    let obj = parse (value);
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
