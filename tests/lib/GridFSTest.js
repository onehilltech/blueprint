var expect    = require ('chai').expect
  , path      = require ('path')
  , fs        = require ('fs')
  , async     = require ('async')
  , mongoose  = require ('mongoose')
  ;

var GridFS  = require ('../../lib/GridFS')
  ;

describe ('GridFS', function () {
  var conn;
  var gridfs;

  var fileDoc;

  describe ('new GridFS', function () {
    it ('should create a new GridFS object', function (done) {
      var opts = {
        connstr: 'mongodb://localhost/blueprint_test_GridFS',

        options : {
          db: {
            native_parser: true,
            read_preference: "primary",
            forceServerObjectId: false,
            w: 1
          },
          server: {
            auto_reconnect: true,
            keepAlive: 1,
            poolSize: 5,
            socketOptions: {}
          }
        }
      };

      conn = mongoose.createConnection ();
      gridfs = new GridFS (conn);

      conn.once ('open', function () {
        expect (gridfs._conn).to.equal (conn);
        return done ();
      });

      conn.open (opts.connstr, opts.options, function (err) {
        if (err) return done (err);
      });
    });
  });

  describe ('#writeFileToDatabase', function () {
    it ('should write a file to the database', function (done) {
      var file = {
        path : 'tests/data/avatar.png',
        mimetype : 'image/png',
        originalname : 'avatar.png'
      };

      gridfs.writeFileToDatabase (file, function (res) {

        expect (res).to.have.any.keys ({
          contentType : file.mimetype,
          filename : file.originalname,
          metadata : {},
        });

        // Save the file document for later usage.
        fileDoc = res;

        return done ();
      });
    });
  });

  describe ('#findOne', function () {
    it ('should find a single file', function (done) {
      gridfs.findOne ({_id : fileDoc._id}, function (err, file) {
        if (err) return done (err);

        expect (file).to.not.be.undefined;
        return done ();
      });
    });
  });

  describe ('#remove', function () {
    it ('should remove a file from the database', function (done) {
      var options = {_id : fileDoc._id};

      gridfs.remove (options, function (err) {
        if (err) return done (err);

        gridfs.findOne (options, function (err, file) {
          if (err) return done (err);

          expect (file).to.be.null;

          return done ();
        });
      });
    });
  });
});