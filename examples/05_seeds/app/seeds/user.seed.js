module.export = exports = {
  pre : function (Model, done) {
    console.log ('This is run before adding the data');
  },
  post : function (Model, done) {
    console.log ('This is run after adding the data');
  },
  data : [
    {firstname: 'John', lastname: 'Doe'},
    {firstname: 'Luke', lastname: 'Skywalker'},
    {firstname: 'Darth', lastname: 'Vader'}
  ]
};