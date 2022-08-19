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

const assert = require ('assert');

/**
 * @class NamedTypes
 *
 * The named type registry
 */
class NamedTypes {
  constructor (type, options = {}) {
    assert (!!type, 'You must provide the type parameter.');

    Object.defineProperty (this, 'type', { value: type, writable: false });

    this._namedTypes = new Map ();
    this._factories = new Map ();
  }

  /**
   * Register a new named type. This method throws an exception if the named type
   * already exists.
   *
   * @param name                    Name of type to register
   * @param Factory                 Factory for creating instances
   * @param failIfDuplicate         Fail if name is a duplicate
   */
  register (name, Factory, failIfDuplicate = true) {
    if (this._namedTypes.has (name)) {
      if (failIfDuplicate) {
        throw new Error (`The named type ${name} already exists.`);
      }
      else {
        console.warn (`${name} ${this.type} is already a registered name; ignoring...`);
        return false;
      }
    }

    this._namedTypes.set (name, Factory);

    return this;
  }

  get names () {
    return this._namedTypes;
  }

  /**
   * Test if the name has been registered.
   *
   * @param name
   * @return {boolean}
   */
  has (name) {
    return this._namedTypes.has (name);
  }

  /**
   * Create a new instance of the named type for the target application.
   *
   * @param name
   * @param app
   * @return {*}
   */
  createInstance (name, app) {
    // Locate the existing factory for the name. If we find one, then use it
    // to create a new instance.

    let factory = this._factories.get (name);

    if (!!factory) {
      return factory.createInstance (app);
    }

    // We could not locate the factory instance. This means it is the first
    // time we are creating an instance of this type. Let's locate the factory
    // type for this named type, and create a new factory. Once we create the
    // factory, we can create a new instance.

    const Factory = this._namedTypes.get (name);

    if (!Factory) {
      throw new Error (`${this.type}:${name} is not a registered ${this.type}.`);
    }

    factory = new Factory ();
    this._factories.set (name, factory);

    return factory.createInstance (app);
  }
}

module.exports = NamedTypes;
