'use strict';

const async   = require ('async')
  , path      = require ('path')
  , blueprint = require ('@onehilltech/blueprint')
  , testing   = require ('../../lib/testing')
  ;

var exports = module.exports;
var appPath = path.resolve (__dirname, './app');

exports.apply = apply;

function apply (callback) {
  async.series ([
    function (callback) { blueprint.testing.createApplicationAndStart (appPath, callback); },
    function (callback) { cleanup (callback); },
    function (callback) { seed (callback); }
  ], callback);
}

function cleanup (callback) {
  testing.clearData (callback);
}

var models = { };

var data = {
  degrees: [
    {degree: 'PhD', major: 'Computer Science', school: 'Vanderbilt University'},
    {degree: 'MS', major: 'Computer Science', school: 'Vanderbilt University'},
    {degree: 'BS', major: 'Computer Science', school: 'Morehouse College'}
  ],

  persons: [
    {
      first_name: 'John',
      last_name: 'Doe',
      age: 25,
      gender: 'Male',
      dob: '2015-10-12 12:00:00',

      address: {
        street: '123 Memory Lane',
        city: 'Gotham City',
        state: 'IN',
        zipcode: '12345'
      }
    }
  ]
};

exports.models = models;
exports.data = data;

function seed (callback) {
  async.series ([
    function (callback) {
      blueprint.app.models.Degree.create (data.degrees, function (err, result) {
        if (err) return callback (err);
        models.degrees = result;
        return callback (null);
      });
    },

    function (callback) {
      async.map (data.persons, function (person, callback) {
        person.education = models.degrees[0]._id;
        return callback (null, person);
      }, insertItems);

      function insertItems (err, persons) {
        if (err) return callback (err);

        blueprint.app.models.Person.create (persons, function (err, result) {
          if (err) return callback (err);
          models.persons = result;
          return callback (null);
        })
      }
    }
  ], callback);
}
