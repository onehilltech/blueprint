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

/**
 * @class Mixin
 *
 * Wrapper facade class for Mixin objects in Blueprint. This implementation is
 * inspired by the Mixin implementation in EmberJS.
 *
 * Do not use the constructor when creating a mixin. Instead, use the static
 * create() method.
 *
 * Ex.
 *
 *   Mixin.create ({ });
 *   Mixin.create (A, {});
 */
class Mixin {
  constructor (mixins, props) {
    this.properties = props;

    let length = mixins && mixins.length;

    if (length > 0) {
      this.mixins = new Array (length);

      for (let i = 0; i < length; i++) {
        let mixin = mixins[i];
        this.mixins[i] = mixin instanceof Mixin ? mixin : new Mixin (undefined, mixin);
      }
    }
    else {
      this.mixins = undefined;
    }
  }

  static create (...args) {
    const M = this;

    return new M (args, undefined);
  }
}

module.exports = Mixin;
