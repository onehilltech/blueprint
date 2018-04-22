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

const assert = require ('assert');

const {
  get,
  has,
  set,
  unset,
  pick,
  forOwn,
  concat,
  merge
} = require ('lodash');

const Mixin = require ('./mixin');
const PropertyDescriptor = require ('./properties/property-descriptor');

const PrototypeMixin = Mixin.create ({
  /// Collection of properties that should be merged with the
  /// base class instead of overwritten.
  mergedProperties: [],

  /// Collection of properties that should be concatenated with the
  /// base class instead of overwritten.
  concatProperties: [],

  /**
   * Gets the value at path of object. If the resolved value is undefined, the
   * defaultValue is returned in its place.
   *
   * @param path          Path in object
   * @param defaultValue  Optional default value
   */
  get (path, defaultValue) {
    return get (this, path, defaultValue);
  },

  /**
   * Creates an object composed of the picked object properties.
   *
   * @param paths
   */
  getProperties (paths) {
    return pick (this, paths);
  },

  /**
   * Sets the value at path of object. If a portion of path doesn't exist, it's
   * created. Arrays are created for missing index properties while objects are
   * created for all other missing properties.
   *
   * @param path
   * @param value
   */
  set (path, value) {
    return set (this, path, value);
  },

  /**
   * Removes the property at path of object.
   *
   * @param path
   */
  unset (path) {
    return unset (this, path);
  },

  /**
   * Checks if path is a direct property of object.
   *
   * @param path
   */
  has (path) {
    return has (this, path);
  }
});

const ClassMixin = Mixin.create ({
  /**
   * Extend this class to create a new type.
   *
   * @param args
   * @returns {{new(): Class, prototype: Class}}
   */
  extend (...args) {
    // Create a class type, and assign the properties to the class prototype.
    // We are just emulating class inheritance so we can support mixins in the
    // extend() method. NOTE: 'this' is the current class because the extend()
    // method appears at the class level.
    let Class = class extends this {
      constructor () {
        super (...arguments);
      }
    };

    Class.ClassMixin = Mixin.create (this.ClassMixin);
    Class.PrototypeMixin = Mixin.create (this.PrototypeMixin, ...args);

    // Apply the different mixins to the Class. This will setup the type inheritance
    // relationships for the Class.
    const PrototypeMixin = Mixin.create (...args);
    Class.ClassMixin.apply (Class);
    PrototypeMixin.apply (Class.prototype);

    return Class;
  },

  /**
   * Create a new instance of this type.
   */
  create () {
    const C = this;
    const AnonymousClass = C.extend (...arguments);

    return new AnonymousClass ();
  }
});

let __nextId = 0;

/**
 * @class BlueprintObject
 *
 * Base class for all objects in the Blueprint framework. We use core-object instead
 * of native JavaScript classes available in ES6 because the class definition cannot
 * contain any data. This, however, does not prevent classes created from core-objects
 * from being extending by ES6 classes.
 */
class BlueprintObject {
  constructor (props = {}) {
    this.__boid__ = `bo${__nextId ++}`;
    this.init.call (this, props);
  }

  init (props) {
    // First, define the merged and concatenated attributes. This way,
    // we do not overwrite them when we are defining them on the target.
    const {concatProperties,mergedProperties} = props;
    assert (!concatProperties, 'concatProperties must be defined in extend()');
    assert (!mergedProperties, 'mergedProperties must be defined in extend()');

    forOwn (props, (value, key) => {
      // In an ideal world, we could check if the value is an instance of the
      // PropertyDescriptor class. Unfortunately, this is not possible since
      // it requires importing the PropertyDescriptor class, which is an instance
      // of a BlueprintObject. This will result in a circular reference, and
      // prevent the source from compiling.
      //
      // So, we just check for the existence of the {descriptor} property.

      if (this.concatProperties && this.concatProperties.includes (key)) {
        this[key] = concat (this[key] || [], value);
      }
      else if (this.mergedProperties && this.mergedProperties.includes (key)) {
        let currentValue = this[key];

        if (currentValue)
          this[key] = merge ({}, currentValue, value);
        else
          this[key] = merge ({}, value);
      }
      else if ((value instanceof PropertyDescriptor)) {
        value.defineProperty (this, key);
      }
      else {
        this[key] = value
      }
    });
  }
}

// Store the ClassMixin in the BlueprintObject, and then apply the general
// class mixin to the base object for all blueprint objects.
BlueprintObject.PrototypeMixin = PrototypeMixin;
BlueprintObject.ClassMixin = ClassMixin;

ClassMixin.apply (BlueprintObject);
PrototypeMixin.apply (BlueprintObject.prototype);

module.exports = BlueprintObject;
