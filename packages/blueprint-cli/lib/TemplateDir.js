'use strict';

var mustache = require ('mustache')
  , fs = require ('fs')
  , path = require ('path')
  , async = require ('async')
  , winston = require ('winston')
  ;

const TEMPLATE_SUFFIX = '.tmpl';

function TemplateDir (srcPath) {
  this._srcPath = srcPath;
}

/**
 * Generate files from the templates into the target directory.
 *
 * @param outPath
 * @param data
 * @param callback
 */
TemplateDir.prototype.render = function (outPath, view, callback) {
  var self = this;

  async.waterfall ([
    function (callback) { fs.readdir (self._srcPath, callback); },

    function (files, callback) {
      // Iterate over each of the files in the directory. If we have a file,
      // then we generate the template. If we have a directory, then we create
      // the corresponding directory in the output, and continue walking.
      var pending = files.length;

      if (pending === 0)
        return callback ();

      files.forEach (function (file) {
        var abspath = path.resolve (self._srcPath, file);
        var dstPath = path.resolve (outPath, file);

        fs.stat (abspath, function (err, stat) {
          function created (err) {
            if (err) return callback (err);

            // Perform the next iteration on the next tick.
            var templateDir = new TemplateDir (abspath);
            templateDir.render (dstPath, view, function (err) {
              if (err)
                return callback (err);

              // Decrement the pending count.
              if (-- pending === 0)
                return callback ();
            });
          }

          if (stat && stat.isDirectory ()) {
            // We need to create the target directory, and recurse into the directory
            // looking for more templates.

            fs.stat (dstPath, function (err, stat) {
              if (stat && stat.isDirectory ())
                return created ();

              winston.log ('debug', 'creating directory: %s', dstPath);
              fs.mkdir (dstPath, created);
            });
          }
          else if (file.indexOf (TEMPLATE_SUFFIX) === (file.length - TEMPLATE_SUFFIX.length)) {
            // Generate the concrete file from the template.

            async.waterfall ([
              function (callback) { fs.readFile (abspath, callback); },
              function (data, callback) {
                var output = mustache.render (data.toString (), view);
                var targetFile = path.resolve (outPath, file.substring (0, file.length - TEMPLATE_SUFFIX.length));

                winston.log ('debug', 'writing file: %s', targetFile);

                fs.writeFile (targetFile, output, callback);
              },

              function (callback) { return callback (null, -- pending); }
            ], function (err, pending) {
              if (pending === 0)
                return callback ();
            });
          }
          else if (-- pending === 0) {
            return callback ();
          }
        });
      });
    }
  ], callback);
};

module.exports = TemplateDir;
