'use strict';

var blueprint = require ('@onehilltech/blueprint')
  , Account   = require ('../../../../app/models/Account')
  ;

var data = {
  client : {
    name: 'test-client',
    email: 'test-client@gatekeeper.com',
    secret: 'test-client',
    roles: ['account.create']
  },

  account: {
    email: 'test-account@gatekeeper.com',
    username: 'test-account',
    password: 'test-account'
  }
};

describe ('Account', function () {
  var account;

  describe ('create and save', function () {
    it ('should save a new account to the database', function (done) {
      account = new Account (data.account);
      account.created_by = blueprint.app.seeds.$default.clients[0]._id;

      account.save (function (err, model) {
        if (err)
          return done (err);

        account = model;
        return done ();
      });
    });
  });
});