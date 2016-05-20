var blueprint = require ('@onehilltech/blueprint')
  , passport  = require ('passport')
  , auth      = require ('../../../lib/authentication')
  ;

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
