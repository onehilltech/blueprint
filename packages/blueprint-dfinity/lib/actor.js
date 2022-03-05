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

const BO = require ('@onehilltech/blueprint');
const Actor = require("@dfinity/agent").Actor;
const { mapValues } = require ('lodash');

/**
 * @class Actor
 *
 * The base class for actor objects.
 */
module.exports = BO.extend ({
  init () {
    this._super.call (this, ...arguments);

    /// The actions known to the actor.
    this._actions = [];
  },

  /**
   * Create an instance of this actor.
   *
   * @param options       Creation options
   */
  createInstance (options) {
    return Actor.createActor (this._createIdlFactory.bind (this), options);
  },

  /**
   * Register an action on the actor.
   *
   * @param name            Name of the action.
   * @param definition       The IDL definition for the action.
   * @private
   */
  registerAction (name, definition) {
    this._actions[name] = definition;
  },

  /**
   * Create an IDL factory for this actor.
   *
   * @param IDL
   * @returns {*}
   * @private
   */
  _createIdlFactory (IDL) {
    /**
     * Make the string definition to the IDL definition.
     *
     * @param definition      String definition
     * @return               IDL definition
     */
    function mapDefinition (definition) {
      return definition.map (term => {
        // Use a simple map. We may want to replace the switch for a function that transforms
        // the text term into to an IDL property.

        switch (term) {
          case 'text':
            return IDL.Text;

          case 'principal':
            return IDL.Principal;

          default:
            throw new Error (`We do not understand '${term}' IDL definition type.`);
        }
      })
    }

    // Map each of the actions defined in this actor to its IDL definition. We then
    // use the collection of definitions to instantiate the actor service.

    const service = mapValues (this._actions, (definition) => {
      const [input, output, type] = definition;
      const inputDefinition = mapDefinition (input);
      const outputDefinition = mapDefinition (output)

      return IDL.Func (inputDefinition, outputDefinition, type);
    });

    return IDL.Service (service);
  },

  /// The actions known to the actor.
  _actions: null,
});
