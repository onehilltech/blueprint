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

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.name, "You must define the 'name' property.");

    this._middleware = this._upload.array (this.name);
  }
});
