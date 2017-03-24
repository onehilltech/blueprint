var gatekeeper = require ('../../../../lib')
  ;

module.exports = exports = {
  '/token': {
    post: { action: 'WorkflowController@issueToken', policy: 'gatekeeper.issueToken' }
  },

  '/logout' : {
    policy: 'gatekeeper.auth.bearer',
    post: { action : 'WorkflowController@logoutUser' }
  }
};
