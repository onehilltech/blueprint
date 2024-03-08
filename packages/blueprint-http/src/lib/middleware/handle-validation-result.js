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

const HttpError = require ('../http-error');
const { validationResult } = require ('express-validator/check');

/**
 * Handle the validation results.
 *
 * @param req
 * @param res
 * @param next
 */
module.exports = function (req, res, next) {
  const errors = validationResult (req);

  if (errors.isEmpty ())
    return next ();

  const validation = errors.mapped ();
  return next (new HttpError (400, 'validation_failed', 'The request validation failed.', { validation }));
};
