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

const {BO, computed, Mixin, PropertyDescriptor } = require ('base-object');

exports.computed = computed;
exports.Mixin = Mixin;
exports.BO = exports.BlueprintObject = BO;
exports.PropertyDescriptor = PropertyDescriptor;

const { AsyncListener, Listener, Events } = require ('./messaging');

exports.Loader = require ('./loader');
exports.Service = require ('./service');

// message framework classes
exports.AsyncListener = AsyncListener;
exports.Listener = Listener;
exports.Events = Events;

exports.BlueprintError = require ('./error');

// computed/bound attributes
const { service, model } = require ('./properties');

exports.service = service;
exports.model = model;
