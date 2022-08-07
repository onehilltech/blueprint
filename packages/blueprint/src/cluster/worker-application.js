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

const { computed } = require ('base-object');
const path = require ('path');
const Application = require ('../application');

/**
 * @class WorkerApplication
 *
 * The worker application in the cluster. The worker application perform all the
 * work when processing requests.
 */
module.exports = Application.extend ({
  tempPath: computed ({
    get () {
      return path.resolve (this.appPath, `.blueprint/${process.pid}`);
    }
  })
});
