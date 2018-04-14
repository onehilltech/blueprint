const assert       = require ('assert');
const UploadAction = require ('./upload-action');

/**
 * @class FieldsUploadAction
 *
 * Action for accepting a mix of files.
 */
module.exports = UploadAction.extend ({
  /// The name of the field that will contain the uploaded file.
  fields: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.fields, "You must define the 'fields' property.");

    this._middleware = this._upload.fields (this.fields);
  }
});
