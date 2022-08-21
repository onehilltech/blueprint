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

const { query, update, Actor } = require ('../lib');

/**
 * @class WhoamiActor
 *
 * https://github.com/dfinity/examples/tree/master/motoko/quicksort
 */
module.exports = class WhoamiActor extends Actor {
  @query (undefined, 'principal')
  installer;

  @query (undefined, 'principal')
  argument;

  @update (undefined, 'principal')
  whoami;

  @update (undefined, 'principal')
  id;

  @update (undefined, 'principal')
  idQuick;
}

