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

module.exports = exports = {};

// controllers
exports.Controller = require ('./controller');
exports.ResourceController = require ('./resource-controller');

// errors
exports.HttpError = require ('./http-error');
exports.BadRequestError = require ('./bad-request-error');
exports.ForbiddenError = require ('./forbidden-error');
exports.NotFoundError = require ('./not-found-error');
exports.UnauthorizedError = require ('./unauthorized-error');
exports.InternalServerError = require ('./internal-server-error');

exports.Router = require ('./router');
exports.Protocol = require ('./server/protocol');

// policy framework
exports.Policy = require ('./policies/policy');
exports.policies = require ('./policies');

// built-in actions
exports.Action = require ('./action');

exports.ViewAction = require ('./view-action');
exports.SingleViewAction = require ('./single-view-action');

exports.UploadAction = require ('./upload-action');
exports.SingleFileUploadAction = require ('./single-file-upload-action');
exports.ArrayUploadAction = require ('./array-upload-action');
exports.FieldsUploadAction = require ('./fields-upload-action');
exports.TextOnlyUploadAction = require ('./text-only-upload-action');
