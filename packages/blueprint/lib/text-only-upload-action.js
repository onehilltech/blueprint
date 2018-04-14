const UploadAction = require ('./upload-action');

/**
 * @class TextOnlyUploadAction
 *
 * Action for uploading text only.
 */
module.exports = UploadAction.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._middleware = this._upload.none ();
  }
});
