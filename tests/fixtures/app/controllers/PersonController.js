'use strict';

var blueprint = require ('../../../../lib')
  , ResourceController = blueprint.ResourceController;
  ;

module.exports = PersonController;

var persons = [];

function PersonController () {
  blueprint.ResourceController.call (this);
}

blueprint.controller (PersonController, ResourceController);

PersonController.prototype.__defineGetter__ ('resourceId', function () {
  return 'personId';
});

PersonController.prototype.create = function () {
  return {
    validate: {
      'person.first_name': {
        notEmpty: {
          errorMessage: 'first_name is required'
        }
      },

      'person.last_name': {
        notEmpty: {
          errorMessage: 'last_name is required'
        }
      }
    },

    execute: function (req, res, callback) {
      var person = req.body.person;
      person._id = persons.length;

      persons.push (person);

      res.status (200).json ({person: person});
      return callback (null);
    }
  }
};

PersonController.prototype.getAll = function () {
  return function (req, res) {
    res.status (200).json ({persons: persons});
  };
};

PersonController.prototype.get = function () {
  return function (req, res) {
    var person = persons[req.params.personId];
    res.status (200).json ({person: person});
  };
};

PersonController.prototype.update = function () {
  return {
    validate: function (req, callback) {
      req.checkBody ('person.first_name').optional ().notEmpty ();
      req.checkBody ('person.last_name').optional ().notEmpty ();

      return callback (req.validationErrors ());
    },

    execute: function (req, res) {
      var personId = req.params.personId;
      var person = persons[req.params.personId];

      if (req.body.person.first_name)
        person.first_name = req.body.person.first_name;

      if (req.body.person.last_name)
        person.last_name = req.body.person.last_name;

      persons[personId] = person;

      res.status (200).json ({person: person});
    }
  };
};

PersonController.prototype.delete = function () {
  return function (req, res) {
    var personId = req.params.personId;

    persons[personId] = null;

    res.status (200).json (true);
  };
};