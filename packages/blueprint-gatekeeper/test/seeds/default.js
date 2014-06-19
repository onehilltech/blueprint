var async = require ('async'),
    User  = require ('../../lib/models/user'),
    oauth2model = require ('../../lib/models/oauth2');

var users = [
  { email: 'john.doe@test.me', password: '123456789' },
  { email: 'jack.black@test.me', password: '0987654321' },
];

var clients = [
  {name: 'Test Client 1', secret: 'abc123', redirect_uri: 'http://localhost:5000/client1/redirect'},
  {name: 'Test Client 2', secret: 'xyz890', redirect_uri: 'http://localhost:5000/client2/redirect'},
  {name: 'Test Client 3 (disabled)', secret: 'xyz890', redirect_uri: 'http://localhost:5000/client3/redirect', disabled: true}
];

exports.data = {
  users : users,
  clients : clients
};

exports.seed = function (opts, done) {
  if (!done) 
    done = opts;

  opts = opts || { };

  // Seed the database with users and events that will be used in the test 
  // cases throughout this test suite.
  async.series ([
    function (callback) {
      User.create (users, function (err, user0, user1) {
        if (err)
          return callback (err);

        users[0]._id = user0._id.toString ();
        users[1]._id = user1._id.toString ();
        return callback ();
      });
    },
    function (callback) {
      oauth2model.Client.create (clients, function (err, client1, client2, client3) {
        if (err)
          return callback (err);

        clients[0]._id = client1._id.toString ();
        clients[1]._id = client2._id.toString ();
        clients[2]._id = client3._id.toString ();

        return callback ();
      });
    }],
    function (err, results) {
      return err ? done (err) : done ();
    });
}

exports.unseed = function (done) {
  async.series ([
    function (callback) {
      oauth2model.AccessToken.remove ({}, function (err) { callback (err); });
    },
    function (callback) {
      oauth2model.Client.remove ({}, function (err) { callback (err); });
    },
    function (callback) {
      User.remove ({}, function (err) { callback (err); });
    }],
    function (err, results) {
      return err ? done (err) : done ();
    });
}

