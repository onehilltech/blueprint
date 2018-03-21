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
  fields: null,

  init () {
    this._super.apply (this, arguments);

    assert (!!this.fields, "You must define the 'fields' property.");

    this._middleware = this._upload.fields (this.fields);
  }
});
