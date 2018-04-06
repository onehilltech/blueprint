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
const validator = require ('../../../../lib/validators/number');

describe ('lib | validators | number', function () {
  it ('should build default validation schema for a number', function () {
    let schema = validator ({options: {}});
    expect (schema).to.deep.equal ({
      isInt: {errorMessage: 'The number is an invalid format.'},
      toInt: true
    });

    schema = validator ({options: {validation: {}}});

    expect (schema).to.deep.equal ({
      isInt: {errorMessage: 'The number is an invalid format.'},
      toInt: true
    });
  });

  it ('should return a schema for validating a type of Number', function () {
    let options = {options: {validation: {kind: 'Float', options: {min: 0.0, max: 6.7}}}};
    let schema = validator (options);

    expect (schema).to.deep.equal ({
      isFloat: {
        errorMessage: 'The number is an invalid format.',
        options: options.options.validation.options
      },
      toFloat: true
    });
  });

  it ('should fail because of unsupported kind', function () {
    let options = {options: {validation: {kind: 'Bar'}}};
    expect (validator.bind (validator, options)).to.throw ('The kind must be one of the following: Decimal,Float,Int,Numeric');
  });
});