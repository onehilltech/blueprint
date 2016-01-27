module.exports = exports = {
  pre : function (Model, done) {
    Model.remove ({}, done);
  },
  data : [
    { first_name: 'John',  last_name: 'Doe'},
    { first_name: 'Jane',  last_name: 'Doe'},
    { first_name: 'Luke',  last_name: 'Skywalker'},
    { first_name: 'Darth', last_name: 'Vader'}
  ]
};
