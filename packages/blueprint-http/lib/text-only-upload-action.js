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

const UploadAction = require ('./upload-action');

/**
 * @class TextOnlyUploadAction
 *
 * Action for uploading text only.
 */
module.exports = UploadAction.extend ({
  /**
   * @override
   */
  async configure () {
    await this._super.call (this, ...arguments);

    this._middleware = this._upload.none ();
  }
});
