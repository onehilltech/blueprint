/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {
  isNumeric,
  isJSON
} = require ('validator');

const { parse } = JSON;

const { isDate } = require ('lodash');
const moment = require ('moment');

module.exports = function (value, opts = {}) {
  if (value === undefined || value === null)
    return false;

  let m = null;

  if (isDate (value)) {
    return true;
  }

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
