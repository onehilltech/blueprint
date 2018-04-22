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

// This regular expression is designed to check if a function calls
// the _super method. We are checking for the following line of code
// in a function:
//
// = this._super.call (this
// = this._super.apply (this
//
// We have designed the regular expression to take into account that
// different developers may have different coding styles. So, we have
// whitespace definitions between each token of interest.

const METHOD_CALLS_SUPER_REGEXP = /this\s*\.\s*_super\s*\.\s*(\s*call|apply)\s*\(\s*this/;

const {
  forOwn,
  isFunction,
  concat,
  isEmpty,
  merge
} = require ('lodash');

const PropertyDescriptor = require ('./properties/property-descriptor');

/**
 * Emulate the polymorphic behavior between the base function and the
 * override function.
 *
 * @param baseFn
 * @param overrideFn
 * @returns {*}
 */
function setupEmulateDynamicDispatch (baseFn, overrideFn) {
  // If the override function does not call _super, then we need to return
  // the override function. If the base function does not exist, then we need
  // to return the override function.
  const callsBaseMethod = METHOD_CALLS_SUPER_REGEXP.test (overrideFn);

  if (!callsBaseMethod)
    return overrideFn;

  // Make sure the base method exists, even if it is a no-op method.
  baseFn = baseFn || function __baseFn () {};

  function __override () {
    let original = this._super;
    this._super = baseFn;

    // Call the method override. The override method will call _super, which
    // will call the base method.
    let ret = overrideFn.call (this, ...arguments);

    this._super = original;

    return ret;
  }

  __override.__baseMethod = baseFn;

  return __override;
}

function defineProperty (target, key, value) {
  let currentValue = target[key];

  if (currentValue) {
    // We are replacing the current value in the target object with the
    // new value from the mixin further down the chain. The approach for
    // replacing the current value depends on its type.

    if (key === 'concatProperties' || key === 'mergedProperties') {
      // do nothing...
    }
    else if (target.concatProperties && target.concatProperties.includes (key)) {
      // Let's concat this value with the target value.
      target[key] = concat (currentValue, value);
    }
    else if (target.mergedProperties && target.mergedProperties.includes (key)) {
      // We need to make a copy of the value. Otherwise, we will mutate the
      // original value as we merge it with other values from subclasses.
      target[key] = merge ({}, currentValue, value);
    }
    else if ((value instanceof PropertyDescriptor)) {
      value.defineProperty (target, key);
    }
    else if (isFunction (currentValue)) {
      target[key] = setupEmulateDynamicDispatch (currentValue, value);
    }
    else {
      // The target is not a method. We therefore just overwrite the current
      // value with the new value.
      target[key] = value;
    }
  }
  else {
    // The target object does not have the value defined. We are just going to
    // add the value to the target. If we are working with a function, then we
    // need to add a root function to prevent the system from crashing.

    if (key === 'concatProperties' || key === 'mergedProperties') {
      // do nothing...
    }
    else if (target.mergedProperties && target.mergedProperties.includes (key)) {
      // We need to make a copy of the value. Otherwise, we will mutate the
      // original value as we merge it with other values from subclasses.
      target[key] = merge ({}, value);
    }
    else if ((value instanceof PropertyDescriptor)) {
      value.defineProperty (target, key);
    }
    else if (isFunction (value)) {
      target[key] = setupEmulateDynamicDispatch (currentValue, value)
    }
    else {
      target[key] = value;
    }
  }
}

function applyMixin (target, mixin) {
  if (mixin.mixins && mixin.mixins.length)
    mixin.mixins.forEach (mixin => applyMixin (target, mixin));

  if (mixin.properties) {
    // First, define the merged and concatenated attributes. This way,
    // we do not overwrite them when we are defining them on the target.
    if (!isEmpty (mixin.properties.concatProperties))
      target.concatProperties = concat (target.concatProperties || [], mixin.properties.concatProperties);

    if (!isEmpty (mixin.properties.mergedProperties))
      target.mergedProperties = concat (target.mergedProperties || [], mixin.properties.mergedProperties);

    forOwn (mixin.properties, (value, key) => defineProperty (target, key, value))
  }
}

/**
 * @class Mixin
 *
 * Wrapper facade class for Mixin objects in Blueprint.
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

  /**
   * Apply the mixin to an object.
   */
  apply (obj) {
    applyMixin (obj, this);
  }
}

module.exports = Mixin;
