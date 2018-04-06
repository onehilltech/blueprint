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

const {expect}  = require ('chai');
const validator = require ('../../../../lib/validation/date');

describe ('lib | validators | date', function () {
  it ('should return the default schema for a Date', function () {
    let schema = validator ({options: {}});
    expect (schema).to.deep.equal ({
      isDate: {errorMessage: 'The date is invalid.'},
      toDate: true
    });

    schema = validator ({options: {validation: {}}});
    expect (schema).to.deep.equal ({
      isDate: {errorMessage: 'The date is invalid.'},
      toDate: true
    });
  });

  it ('should return a schema for validating a Number date', function () {
    let options = {options: {validation: {kind: 'Numeric'}}};
    let schema = validator (options);

    expect (schema).to.deep.equal ({
      isNumeric: {errorMessage: 'The numeric date is invalid.'},
      toDate: true
    });
  });
});