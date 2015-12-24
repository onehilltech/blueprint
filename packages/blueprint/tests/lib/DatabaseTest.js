var expect    = require ('chai').expect
  , path      = require ('path')
  , fs        = require ('fs')
  , async     = require ('async')
  ;

var Database  = require ('../../lib/Database')
  ;

describe ('Database', function () {
  var db;
  var Model;

  const COLLECTION_NAME = 'message';

  var schema  = new Database.Schema ({
    first_name : {type: String, required: true},
    last_name  : {type: String, required: true}
  });

  describe ('new Database', function () {
    it ('should create a new database', function () {
      var opts = {
        connstr: 'mongodb://localhost/blueprint_DatabaseTest',

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

      db = new Database (opts);
      expect (db).to.not.be.null;
    });
  });

  describe ('#connect', function () {
    it ('should connect to the database', function (done) {
      db.connect (function (err) {
        if (err) return done (err);

        expect (db._conn.readyState).to.equal (1);
        return done ();
      });
    });
  });

  describe ('#registerModel', function () {
    it ('should register a model with the database', function (done) {
      Model = db.registerModel (COLLECTION_NAME, schema);
      expect (db.models).to.have.keys (COLLECTION_NAME);

      Model.remove ({}, function (err) {
        return done (err);
      });
    });
  });

  describe ('#seed', function () {
    it ('should seed the database', function (done) {
      var seed = {
        data : [
          { first_name: 'John',  last_name: 'Doe'},
          { first_name: 'Jane',  last_name: 'Doe'},
          { first_name: 'Luke',  last_name: 'Skywalker'},
          { first_name: 'Darth', last_name: 'Vader'}
        ]
      };

      db.seed (COLLECTION_NAME, seed, function (err, seed) {
        expect (err).to.be.undefined;
        expect (seed).to.not.be.undefined;

        expect (seed.documents).to.have.length (4);

        Model.find ({}, function (err, docs) {
          if (err) return done (err);

          expect (docs).to.have.length (4);

          return done ();
        });
      });
    });
  });

  describe ('#disconnect', function () {
    it ('should disconnect from the database', function (done) {
      db.disconnect (done);
    });
  });
});