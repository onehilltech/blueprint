const Loader = require ('./loader');

module.exports = Loader.extend ({
  load (opts = {}) {
    var filter = this._opts.filter || /(.+)\.js$/;
    var excludeDirs = this._opts.excludeDirs || ResourceManager.SCM_DIRECTORIES;
    var resolve = this._opts.resolve;

    const opts = {
      dirname: path,
      filter: filter,
      excludeDirs: excludeDirs,
      recursive: recursive,
      resolve: resolve
    };

    return this._super.call (this, {
      map (name, path) {
        return name;
      }
    });

  }
});
