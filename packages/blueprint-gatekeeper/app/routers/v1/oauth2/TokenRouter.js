var gatekeeper = require ('../../../../lib')
  ;

module.exports = exports = {
  '/token': {
    post: { action: 'TokenController@issueToken', policy: 'gatekeeper.issueToken' }
  },

  '/logout' : {
    policy: 'gatekeeper.auth.bearer',
    post: { action : 'TokenController@logoutUser' }
  }
};
