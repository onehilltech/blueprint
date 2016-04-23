var blueprint = require ('@onehilltech/blueprint')
  , auth      = require ('../../../lib/index').auth
  ;

var passport  = blueprint.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':imageId'    : { property : 'imageId' },

  // Define the routes.
  '/images/:imageId' : {
    use: [
      passport.authenticate('bearer', {session: false})
    ],

    get : {action: 'ImagesController@getImage'}
  }
};
