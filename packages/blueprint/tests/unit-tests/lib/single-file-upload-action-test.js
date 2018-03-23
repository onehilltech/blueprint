const SingleFileUploadAction = require ('../../../lib/single-file-upload-action');
const executeAction = require ('../../../lib/middleware/execute-action');

const {expect} = require ('chai');
const request  = require ('supertest');
const express  = require ('express');
const path     = require ('path');

describe ('lib | SingleFileUploadAction', function () {
  describe ('constructor', function () {
    it ('should create an SingleFileUploadAction object', function () {
      let action = new SingleFileUploadAction ({
        uploadPath: './temp',
        name: 'avatar'
      });

      expect (action).to.have.property ('name', 'avatar');
    });
  });

  describe ('execute', function () {
    it ('should upload a file', function (done) {
      let action = new SingleFileUploadAction ({
        uploadPath: './temp',
        name: 'avatar',
        uploadCompleteCalled: false,

        onUploadComplete (req, res) {
          // check for the normal fields.
          expect (req).to.have.property ('body').to.include ({
            name: 'James Hill'
          });

          // check the upload file.
          expect (req).to.have.property ('file').to.include ({
              fieldname: 'avatar',
              mimetype: 'image/png',
              originalname: 'avatar.png'
          });

          res.status (200).json ({comment: 'The upload is complete!'});
          this.uploadCompleteCalled = true;
        }
      });

      let app = express ();
      app.post ('/profile', executeAction (action));

      const avatarPng = path.resolve (__dirname, '../../files/avatar.png');

      request (app)
        .post ('/profile')
        .field ('name', 'James Hill')
        .attach ('avatar', avatarPng)
        .expect (200, {comment: 'The upload is complete!'})
        .end (err => {
          if (err) return done (err);

          expect (action).to.have.property ('uploadCompleteCalled').to.be.true;
          done ();
        });
    });
  });
});
