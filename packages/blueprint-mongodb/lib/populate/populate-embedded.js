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

const Populate  = require ('./populate');

const {
  mapValues,
  flattenDeep,
  isEmpty
} = require ('lodash');

const BluebirdPromise = require ('bluebird');

/**
 * @class PopulateEmbedded
 */
module.exports = Populate.extend ({
  populators: null,

  accept (v) {
    v.visitPopulateEmbedded (this);
  },

  populate (unseen) {
    let pending = mapValues (this.populators, (populator, name) => {
      const values = unseen[name];

      if (isEmpty (values))
        return null;

      const ids = flattenDeep (values);

      return populator.populate (ids).exec ();
    });

    return BluebirdPromise.props (pending);
  }
});

/*
PopulateEmbedArray.prototype.populate = function (ids, callback) {
  async.mapValues (ids, function (values, path, callback) {
    var populate = this._populate[path];

    async.map (values, function (value, callback) {
      populate.populate (value, callback);
    }, callback);
  }.bind (this), callback);
};

PopulateEmbedArray.prototype.getUnseenIds = function (values, ids, callback) {
  var unseen = {};

  function complete (err) {
    return callback (err, unseen);
  }

  async.eachOf (this._populate, function (populate, path, callback) {
    async.each (values, function (value, callback) {
      const data = value[path];

      if (!data)
        return callback (null);

      async.waterfall ([
        function (callback) {
          populate.getUnseenIds (data, ids, callback);
        },

        function (result, callback) {
          if (!result)
            return callback (null);

          if (unseen[path])
            unseen[path].push (result);
          else
            unseen[path] = [result];

          return callback (null);
        }
      ], callback);
    }, callback);
  }, complete);
};
*/