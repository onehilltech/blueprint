const assert       = require ('assert');
const UploadAction = require ('./upload-action');

/**
 * @class SingleFileUploadAction
 *
 * Action for uploading a single file. The file is expected to be part of a
 * multipart/form-data request.
 */
module.exports = UploadAction.extend ({
  /// The name of the field that will contain the uploaded file.
  name: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.name, "You must define the 'name' property.");

    this._middleware = this._upload.single (this.name);
  }
});
