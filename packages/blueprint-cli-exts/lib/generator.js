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

const { BO } = require ('base-object');

const {
  capitalize,
  escape,
  kebabCase,
  lowerCase,
  lowerFirst,
  pad,
  padEnd,
  padStart,
  repeat,
  snakeCase,
  toLower,
  toUpper,
  trim,
  trimStart,
  trimEnd,
  truncate,
  upperCase,
  upperFirst,
  unescape,
  words
} = require ('lodash');

/**
 * @class Generator
 *
 * Base class for all generators used by the cli.
 */
module.exports = BO.extend ({
  concatProperties: ['args'],
  mergedProperties: ['helpers', 'options'],

  /// Free-range arguments for the command.
  args: null,

  /// Description of the generation.
  description: null,

  /// Options for the generator.
  options: null,

  /**
   * Register all the helpers for the generator.
   *
   * @param         env       The Handlebars environment
   */
  registerHelpers (env) {
    env.registerHelper (this.helpers);
  },

  /**
   * Helpers are functions that are registered with the handlebars framework, and
   * transform the input parameters to a output string.
   */
  helpers: {
    capitalize (str) {
      return capitalize (str);
    },

    escape (str) {
      return escape (str);
    },

    kebabCase (str) {
      return kebabCase (str);
    },

    lowerCase (str) {
      return lowerCase (str);
    },

    lowerFirst (str) {
      return lowerFirst (str);
    },

    pad () {
      return pad (...arguments);
    },

    padEnd () {
      return padEnd (...arguments);
    },

    padStart () {
      return padStart (...arguments);
    },

    repeat (str = '', n = 1) {
      return repeat (str, n);
    },

    snakeCase (str) {
      return snakeCase (str);
    },

    toLower (str) {
      return toLower (str);
    },

    toUpper (str) {
      return toUpper (str);
    },

    trim () {
      return trim (...arguments);
    },

    trimEnd () {
      return trimEnd (...arguments);
    },

    trimStart () {
      return trimStart (...arguments);
    },

    truncate () {
      return truncate (...arguments)
    },

    upperCase (str) {
      return upperCase (str);
    },

    upperFirst (str) {
      return upperFirst (str);
    },

    unescape (str) {
      return unescape (str);
    },

    words (str) {
      return words (str);
    }
  }
});
