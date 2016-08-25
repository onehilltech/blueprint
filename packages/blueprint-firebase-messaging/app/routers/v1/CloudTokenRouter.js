var passport = require ('passport')
  ;

module.exports = exports = {
  '/cloudtoken' : {
    use: passport.authenticate ('bearer', {session: false}),
    post: { action : 'CloudTokenController@registerToken' }
  }
};
