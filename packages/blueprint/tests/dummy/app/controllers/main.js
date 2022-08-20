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
const {
  check
} = require('express-validator/check');

const {
  Controller,
  Action,
  service,
  model
} = require('../../../../lib');

module.exports = Controller.extend({
  cart: service(),
  shoppingCart: service('shopping-cart'),
  person: model(),
  model: model('person'),

  __invoke() {
    return Action.extend({
      execute(req, res) {
        return res.status(200).json(true);
      }

    });
  },

  performGet() {
    return Action.extend({
      validate(req) {},

      execute(req, res) {
        return res.status(200).json(true);
      }

    });
  },

  getFunction() {
    return function (req, res, next) {
      res.status(200).json({
        result: 'getFunction'
      });
      next();
    };
  },

  getFunctionArray() {
    return [(req, res, next) => {
      next();
    }, (req, res, next) => {
      res.status(200).json({
        result: 'getFunctionArray'
      });
      next();
    }];
  },

  getActionWithSchema() {
    return Action.extend({
      schema: {
        id: {
          // The location of the field, can be one or more of body, cookies, headers, params or query.
          // If omitted, all request locations will be checked
          in: ['params', 'query'],
          errorMessage: 'ID is wrong',
          optional: true,
          isInt: true,
          // Sanitizers can go here as well
          toInt: true
        }
      },

      execute(req, res, next) {
        res.status(200).json({
          result: 'getActionWithSchema'
        });
        next();
      }

    });
  },

  getActionWithValidate() {
    return Action.extend({
      validate: [check('username').isEmail().withMessage('must be an email').optional().trim().normalizeEmail()],

      execute(req, res) {
        res.status(200).json({
          result: 'getActionWithValidate'
        });
      }

    });
  },

  postActionWithValidateFail() {
    return Action.extend({
      validate: [check('username').isEmail().withMessage('The username must be an email').trim().normalizeEmail()],

      execute(req, res, next) {
        res.status(200).json({
          result: 'postActionWithValidateFail'
        });
        next();
      }

    });
  }

});