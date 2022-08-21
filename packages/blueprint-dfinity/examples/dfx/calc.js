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

const { update, Actor } = require ('../lib');

/**
 * @class CalcActor
 *
 * https://github.com/dfinity/examples/blob/master/motoko/calc/src/Main.mo
 */
module.exports = class CalcActor extends Actor {
  @update ('int', 'int')
  add;

  @update ('int', 'int')
  sub;

  @update ('int', 'int')
  mul;

  @update ('int', 'int')
  div;

  @update
  clearall;
};

