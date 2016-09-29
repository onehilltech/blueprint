'use strict';

var blueprint = require ('../../../../lib')
  ;

module.exports = PersonController;

var persons = [];

function PersonController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (PersonController);

PersonController.prototype.__defineGetter__ ('resourceId', function () {
  return 'personId';
});

PersonController.prototype.create = function () {
  return function (req, res) {
    var person = req.body.person;
    person._id = persons.length;

    persons.push (person);

    res.status (200).json ({person: person});
  };
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
  return function (req, res) {
    var personId = req.params.personId;
    var person = persons[req.params.personId];

    if (req.body.person.first_name)
      person.first_name = req.body.person.first_name;

    if (req.body.person.last_name)
      person.last_name = req.body.person.last_name;

    persons[personId] = person;

    res.status (200).json ({person: person});
  };
};

PersonController.prototype.delete = function () {
  return function (req, res) {
    var personId = req.params.personId;

    persons[personId] = null;

    res.status (200).json (true);
  };
};