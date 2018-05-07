/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
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

const { EntityGenerator } = require ('@onehilltech/blueprint-cli-exts');
const path = require ('path');

module.exports = EntityGenerator.extend ({
  description: 'generates a new controller',

  options: {
    '--default-action': 'generate the default action'
  },

  helpers: {
    entityBaseName () {
      let parts = this.args[0].split (path.sep);
      return parts[parts.length - 1];
    }
  }
});
