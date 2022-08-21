/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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

const { update, query, Actor } = require ('../lib');

/**
 * @class HelloWorldActor
 *
 * This example was borrowed from:
 *
 *   https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169
 */
module.exports = class HelloWorldActor extends Actor {
  /// Define the greet update method.
  @update ('text', 'text')
  greet;

  /// Define the green query method.
  @query ('text', 'text')
  greetq;

  /// Define the whoami method.
  @query (undefined, 'principal')
  whoami;
}

