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

const { Service, resource, service } = require ('../../../../lib');

module.exports = class CompositionService extends Service {
  a = 5;

  @resource('service')
  cart;

  @resource('service', 'unknown')
  missing;

  @service
  shoppingCart;

  @service('shopping-cart')
  anotherShoppingCart;
}
