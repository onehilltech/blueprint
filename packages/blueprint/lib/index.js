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

module.exports = exports = require ('./-framework');

exports.Mixin = require ('./mixin');
exports.BO = exports.BlueprintObject = require ('./object');

const {
  Listener,
  Events
} = require ('./messaging');

exports.Loader = require ('./loader');

exports.Listener = Listener;
exports.Events = Events;

exports.Controller = require ('./controller');
exports.ResourceController = require ('./resource-controller');

exports.barrier = require ('./barrier');
exports.BlueprintError = require ('./error');
exports.HttpError = require ('./http-error');
exports.Policy = require ('./policy');
exports.Router = require ('./router');

// built-in actions
exports.Action = require ('./action');

exports.ViewAction = require ('./view-action');
exports.SingleViewAction = require ('./single-view-action');

exports.UploadAction = require ('./upload-action');
exports.SingleFileUploadAction = require ('./single-file-upload-action');
exports.ArrayUploadAction = require ('./array-upload-action');
exports.FieldsUploadAction = require ('./fields-upload-action');
exports.TextOnlyUploadAction = require ('./text-only-upload-action');
exports.Service = require ('./service');

// policy builders
exports.policies = require ('./policies');

// computed properties

const {
  computed,
  service
} = require ('./properties');

exports.computed = computed;
exports.service = service;
