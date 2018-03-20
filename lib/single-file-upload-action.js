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
    this._super.apply (this, arguments);

    assert (!!this.name, "You must define the 'name' property.");

    this._middleware = this._upload.single (this.name);
  },

  /**
   * Execute the action.
   *
   * @param req     The request object.
   * @param res     The response object.
   */
  execute (req, res) {
    return this._uploadFile (req, res).then (() => this.onUploadComplete (req, res));
  },

  /**
   * Upload the file.
   *
   * @param req     The request object.
   * @param res     The response object.
   */
  _uploadFile (req, res) {
    return new Promise ((resolve,reject) => {
      this._middleware (req, res, err => {
        return !err ? resolve () : reject (err);
      })
    });
  },

  /**
   * Notify the subclass the upload is complete.
   *
   * @param req     The request object.
   * @param res     The response object.
   * @returns {null}
   */
  onUploadComplete (req, res) {
    return null;
  }
});
