var passport   = require ('passport')
  ;

module.exports = exports = {
  '/clients' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { controller: 'ClientController' }
  }
};
