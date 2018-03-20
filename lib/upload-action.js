const Action    = require ('./action');
const {resolve} = require ('path');
const {merge}   = require ('lodash');
const framework = require ('./-framework');
const get       = require ('object-path');
const multer    = require ('multer');

/**
 * @class UploadAction
 *
 * Base class for all upload actions. This action will initialize a new instance
 * of multer, and store it internally for subclasses to use.
 */
module.exports = Action.extend ({
  /// The default upload path for all files. This will default to [appPath]/uploads,
  /// if nothing is provided.
  uploadPath: null,

  /// The other options for multer.
  uploadOptions: null,

  init () {
    this._super.apply (this, arguments);

    if (!this.uploadPath)
      this.uploadPath = resolve (framework.app.tempPath, 'uploads');

    let baseOptions = {};
    let storage = get (this.uploadOptions, 'storage');

    if (!storage)
      baseOptions.dest = this.uploadPath;

    const options = merge (baseOptions, this.uploadOptions);
    this._upload = multer (options);
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
