const assert = require ('assert');
const Loader = require ('./loader');
const path   = require ('path');
const async  = require ('async');
const fs     = require ('fs-extra');
const _      = require ('lodash');

/**
 * @class ListenerLoader
 *
 * Loader class designed for loading application listeners.
 */
module.exports = Loader.extend ({
  load (opts) {
    assert (!!opts.dirname, 'Your options must have a `dirname` property');

    let {dirname} = opts;

    return new Promise ((resolve, reject) => {
      let listeners = {};

      function done (err) {
        if (!err)
          return resolve (listeners);

        if (err.code === 'ENOENT')
          return resolve ({});

        return reject (err);
      }

      async.waterfall ([
        /*
         * Let's make sure the location is a directory.
         */
        (callback) => {
          fs.stat (dirname, callback);
        },

        (stats, callback) => {
          if (!stats.isDirectory ())
            return callback (new Error (`location is not a directory: ${dirname}`));

          fs.readdir (dirname, callback);
        },

        (files, callback) => {
          async.forEach (files, (eventName, callback) => {
            // Determine if the current file is a directory. If the path is a directory,
            // then we are processing an event name.
            const eventPath = path.join (dirname, eventName);

            async.waterfall ([
              (callback) => {
                fs.stat (eventPath, callback);
              },

              (stats, callback) => {
                if (!stats.isDirectory ())
                  return callback (null);

                let loader = new Loader ();

                loader.load ({
                  dirname: eventPath,
                  recursive: false,
                  excludeDirs: /.*/,
                  resolve: resolve.bind (this)
                }).then (result => {
                  listeners[eventName] = _.merge ({}, listeners[eventName], result);

                  callback (null);
                }).catch (err => {
                  callback (err);
                });

                function resolve (listener) {
                  //let key = listener.targetMessenger || '_';
                  //let messenger = this._messaging.getMessenger (key);
                  //messenger.on (eventName, listener);

                  return listener;
                }
              }
            ], callback);
          }, callback);
        }
      ], done);
    });
  }
});
