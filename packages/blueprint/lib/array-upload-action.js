const assert       = require ('assert');
const UploadAction = require ('./upload-action');

/**
 * @class ArrayUploadAction
 *
 * Action for uploading an array files. The files will be available on req.files
 * in onUploadComplete(req,res).
 */
module.exports = UploadAction.extend ({
  /// The name of the field that will contain the uploaded files.
  name: null,

  async configure () {
    await this._super.call (this, ...arguments);

    this._middleware = this._upload.array (this.name);
  }
});
