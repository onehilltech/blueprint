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

const { ref } = require ('@onehilltech/dab');
const Seed = require ('../../../../../lib/seed');

module.exports = Seed.extend ({
  model () {
    return {
      projects: [
        {title: 'Project 1', description: 'This is the title for project 1.'},
        {title: 'Project 2', description: 'This is the title for project 2.'},
        {title: 'Project 3', description: 'This is the title for project 3.'},
      ]
    }
  }
});
