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

const { ResourceController } = require ('@onehilltech/blueprint-http');

function simpleHandler (method) {
  return (req, res, next) => {
    res.status (200).json ({method});
    next ();
  }
}

function singleEntityHandler (method, param) {
  return (req, res, next) => {
    res.status (200).json ({method, id: req.params[param]});
    next ();
  }
}

module.exports = ResourceController.extend ({
  name: 'user',

  create () { return simpleHandler ('create'); },
  getAll () { return simpleHandler ('getAll'); },
  getOne () { return singleEntityHandler ('getOne', 'userId') },
  update () { return singleEntityHandler ('update', 'userId') },
  delete () { return singleEntityHandler ('delete', 'userId') },
  count () { return simpleHandler ('count'); }
});
