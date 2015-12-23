var mongoose  = require ('mongoose')
  , winston   = require ('winston')
  , util      = require ('util')
  , fs        = require ('fs')
  , async     = require ('async')
  ;

var GridFS = require ('./GridFS')
  , Path   = require ('./Path')
  ;

var SEED_SUFFIX = '.seed.js';

function Database (opts) {
  this._opts = opts;
}

Database.prototype.setMessenger = function (messenger) {
  this._messenger = messenger;
};

Database.prototype.connect = function (callback) {
  var self = this;
  winston.log ('debug', 'database connection: %s', this._opts.connstr);
  winston.log ('debug', 'database options: %s', util.inspect (this._opts.options));

  // Connect to the database.
  mongoose.connect (this._opts.connstr, this._opts.options, function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.connect', self);

    callback (err);
  });

  // Initialize GridFS support for the database.
  this._gridFS = new GridFS (mongoose.connection);
};

Database.prototype.disconnect = function (callback) {
  var self = this;
  winston.log ('debug', 'disconnecting from database');

  mongoose.connection.close (function (err) {
    // Delete our instance of GridFS.
    delete self._gridFS;

    if (!err && self._messenger)
      self._messenger.emit ('database.disconnect', self);

    callback (err);
  });
};

Database.prototype.registerModel = function (name, schema) {
  if (mongoose.models[name])
    return mongoose.models[name];

  winston.log ('debug', 'model registration: %s', name);

  var model = mongoose.model (name, schema);

  if (this._messenger)
    this._messenger.emit ('database.model', this, model);

  return model;
};

/**
 * Seed the database. Each separate file in the \a path contains the data for
 * each model (or collection) in the database. The name of the file is the
 * name of the target collection.
 *
 * @param path
 * @param env
 */
Database.prototype.seed = function (path, done) {
  done = done || function (err) {};

  try {
    var files = fs.readdirSync (path);

    async.each (
      files,
      function (filename, cb) {
        var filePath = Path.resolve (path, filename);

        // The filePath must be a .seed.json or .seed.js file, and not be a directory.
        if (!filePath.path.endsWith (SEED_SUFFIX))
          return cb ();

        try {
          var stat = fs.lstatSync (filePath.path);

          if (stat.isDirectory ())
            return cb ();

          // Get the model name from the file name.
          var collectionName = filename.substring (0, SEED_SUFFIX.length - 1);
          var seed = require (filePath.path);

          // Locate the collection model in the database, then use the data in the
          // seed to add the documents to the collection.
          var Model = mongoose.models[collectionName];

          if (!Model)
            return cb (new Error (util.format ('collection does not exist [%s]', collectionName)));

          Model.create (seed.data, function (err, docs) {
            if (err) return cb (err);

            // Save the created documents.
            seed.documents = docs;

            return cb ();
          });
        }
        catch (ex) {
          // Do nothing. The directory does not exist.
        }
      }, done);
  }
  catch (ex) {
    process.nextTick (function () {
      done ();
    });
  }
};

Database.prototype.__defineGetter__ ('Schema', function () {
  return mongoose.Schema;
});

Database.prototype.__defineGetter__ ('gridfs', function () {
  return this._gridFS;
});

Database.prototype.__defineGetter__ ('models', function () {
  return mongoose.models;
});

/**
 * Create a GridFS write stream to the database.
 *
 * @param file
 * @param metadata
 * @returns {Stream}
 */
Database.prototype.createWriteStream = function (opts) {
  return this._gridFS.createWriteStream (opts);
};


// Export the database, and the different class types.
module.exports = exports = Database;
exports.Schema = mongoose.Schema;
