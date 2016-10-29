var blueprint = require ('@onehilltech/blueprint')
  ;

var User;

blueprint.messaging.on ('app.init', function (app) {
  User = app.models.User;
});

module.exports = {
  protocols : {
    http : {
      port: 5000
    }
  },

  middleware : {
    bodyParser : {
      urlencoded : { extended: false }
    },

    morgan: {
      format: 'dev',
      immediate: true
    },

    passport: {
      session: {
        serializer: function (user, done) {
          return done (null, user.id);
        },

        deserializer: function (id, done) {
          User.findById (id, done);
        }
      }
    },

    session: {
      secret: 'ssshhhhh',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }  // set to true for https://
    }
  }
};
