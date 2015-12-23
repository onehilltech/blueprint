var expect    = require ('chai').expect
  , path      = require ('path')
  , fs        = require ('fs')
  ;

var blueprint = require ('../fixtures/blueprint')
  , Database  = require ('../../lib/Database')
  ;

describe ('Database', function () {
  var appPath = path.resolve (__dirname, '../fixtures/app');
  var db;
  var schema;

  const COLLECTION_NAME = 'message';

  var opts = {
    connstr: 'mongodb://localhost/blueprint-unit-tests',

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

  before (function () {
    blueprint.destroy ();
    app = blueprint.Application (appPath);

    schema = new blueprint.Schema({
      timestamp: {type: Date, required: true, default: Date.now},
      title: {type: String, required: true, trim: true},
      content: {type: String, required: true, trim: true},
    });
  });

  describe ('new Database', function () {
    db = new Database (opts);

    it ('should create a new database', function () {
      expect (db).to.not.be.null;
    });
  });

  describe ('#registerModel', function () {
    it ('should register a model with the database', function () {
      db.registerModel (COLLECTION_NAME, schema);
      expect (db.models).to.have.any.keys (COLLECTION_NAME);
    });
  });

  describe ('#connect', function () {
    it ('should connect to the database', function (done) {
      db.connect (done);
    });
  });

  describe ('#seed', function () {
    it ('should seed the database', function (done) {
      var seedPath = path.resolve (__dirname, '../fixtures/seeds');
      db.seed (seedPath, done);
    });
  });

  describe ('#disconnect', function () {
    it ('should disconnect from the database', function (done) {
      db.disconnect (done);
    });
  });
});