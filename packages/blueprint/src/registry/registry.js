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

const NamedTypes = require ('./named-types');

/**
 * @class Registry
 *
 * Top-level registry for different types. Each entry in the registry is a NamedTypes
 * instance.
 *
 * The registry is used to defined different types and create instances of each type. You must
 * define the type before you can create an instances of the type.
 */
class Registry {
  constructor () {
    Object.defineProperty (this, 'types', { value: new Map (), writable: false });
  }

  /**
   * Define a new top-level type in the registry, such as model, service, controller. You must define
   * the type before you can register named types under the type.
   *
   * @param type
   * @param options
   *
   */
  defineType (type, options) {
    if (this.types.has (type))
      throw new Error (`${type} type is already defined. You cannot define a type more than once.`);

    const registry = new NamedTypes (type, options);
    this.types.set (type, registry);

    return this;
  }

  /**
   * Test if the typename has been registered.
   *
   * @param typename
   * @return {boolean|*}
   */
  has (typename) {
    const [type, name] = typename.split (':');
    const namedTypes = this.types.get (type);

    if (!name)
      return !!namedTypes;

    // There is a name in the typename. We need to check if the name has been
    // registered with the named types registry.

    return !!namedTypes && namedTypes.has (name);
  }

  /**
   * Register a named type with the registry.
   *
   * The typename must have the format <name:type> where \a type is the registered type, and
   * \a name is the name of the type to register. The \a Factory is a factory class for creating
   * an instance of the named type.
   *
   * @param typename        Type name to register.
   * @param Factory         The factory for creating instances of type.
   */
  register (typename, Factory) {
    const [type, name] = typename.split (':');
    const registry = this.types.get (type);

    if (!registry)
      throw new Error (`You must define the type ${type} before you can register components of type ${type}.`);

    registry.register (name, Factory);

    return this;
  }

  /**
   * Create an instance of a registered type.
   *
   *   Ex. service:shopping-cart
   *
   * @param typename          Type name of instance to create
   * @param app               Target application for instance
   */
  createInstance (typename, app) {
    const [type, name] = typename.split (':');
    const registry = this.types.get (type);

    if (!registry)
      throw new Error (`${type} is not a registered type.`);

    return registry.createInstance (name, app);
  }
}

module.exports = Registry;
