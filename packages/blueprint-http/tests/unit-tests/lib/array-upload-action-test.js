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

const blueprint = require ('../../../lib');
const ArrayUploadAction = require ('../../../lib/array-upload-action');
const executeAction = require ('../../../lib/middleware/execute-action');

const {expect} = require ('chai');
const request  = require ('supertest');
const express  = require ('express');
const path     = require ('path');

describe ('lib | ArrayUploadAction', function () {
  describe ('constructor', function () {
    it ('should create an ArrayUploadAction object', async function () {
      const action = new ArrayUploadAction ({
        uploadPath: './temp',
        name: 'avatar'
      });

      await action.configure ({ app: blueprint.app } );

      expect (action).to.have.property ('name', 'avatar');
    });
  });

  describe ('execute', function () {
    it ('should upload an array of files', async function () {
      const action = ArrayUploadAction.create ({
        uploadPath: './temp',
        name: 'avatar',
        uploadCompleteCalled: false,

        onUploadComplete (req, res) {
          // check for the normal fields.
          expect (req).to.have.property ('body').to.include ({
            name: 'James Hill'
          });

          // check the upload file.
          expect (req).to.have.property ('files').to.have.length (2);
          expect (req).to.have.nested.property ('files[0]').to.include ({ fieldname: 'avatar', mimetype: 'image/png', originalname: 'avatar.png' });
          expect (req).to.have.nested.property ('files[1]').to.include ({ fieldname: 'avatar', mimetype: 'image/png', originalname: 'avatar.png' });

          res.status (200).json ({comment: 'The upload is complete!'});
          this.uploadCompleteCalled = true;
        }
      });

      await action.configure ({ app: blueprint.app } );

      const app = express ();
      app.post ('/profile', executeAction (action));

      const avatarPng = path.resolve ('./tests/files/avatar.png');

      await request (app)
        .post ('/profile')
        .field ('name', 'James Hill')
        .attach ('avatar', avatarPng)
        .attach ('avatar', avatarPng)
        .expect (200, {comment: 'The upload is complete!'});

      expect (action).to.have.property ('uploadCompleteCalled').to.be.true;
    });
  });
});
