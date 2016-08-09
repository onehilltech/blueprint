var async      = require ('async')
  , winston    = require ('winston')
  , mongoose   = require ('mongoose')
  ;

var blueprint = require ('./blueprint')
  , connect   = require ('./connect')
  ;

var Person;

blueprint.messaging.once ('app.init', function (app) {
  Person = app.models.Person;
});

var data = {
  persons : [
    { first_name: 'Jane', last_name: 'Due'},
    { first_name: 'John', last_name: 'Doe'},
    { first_name: 'Jonah', last_name: 'Hill'},
    { first_name: 'Mike', last_name: 'Jones'}
  ]
};

exports.data = data;
exports.models = { };

function seed (done) {
  winston.log ('info', 'seeding the database');

  async.series ([
    function (callback) {
      Person.create (data.persons, function (err, persons) {
        exports.models.persons = persons;

        async.forEachOf (persons, function (person, index, callback) {
          data.persons[index]._id = person.id;
          return callback ();
        });

        return callback (err);
      });
    }
  ], done);
}

function cleanup (done) {
  winston.log ('info', 'cleaning the database');

  async.series ([
    function (cb) { Person.remove ({}, cb); }
  ], done);
}

exports.apply = function (done) {
  winston.log ('info', 'applying data model to test cases');

  async.series ([
    function (callback) { connect (callback); },
    function (callback) { cleanup (callback); },
    function (callback) { seed (callback); }
  ], done);
};

exports.cleanup = cleanup;
