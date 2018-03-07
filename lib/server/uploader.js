const Object = require ('../object');
const multer = require ('multer');

module.exports = Object.extend ({
  init (opts) {
    this._super.init.apply (this, opts);
    this._upload = multer (opts);
  },

  /**
   * Update a single file.
   *
   * @param name
   * @param next
   * @returns {*[]}
   */
  singleFile (name, next) {
    return [
      this._upload.single (name),
      next
    ];
  },

  /**
   * Update multiple files.
   *
   * @param name
   * @param maxCount
   * @param next
   * @returns {*[]}
   */
  multipleFiles (name, maxCount, next) {
    return [
      this._upload.array (name, maxCount),
      next
    ];
  }
});
