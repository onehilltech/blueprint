var gatekeeper = require ('../../../../lib')
  ;

module.exports = exports = {
  '/token': {
    post: { action: 'WorkflowController@issueToken', policy: 'gatekeeper.issueToken' }
  },

  '/logout' : {
    use: gatekeeper.protect (),
    post: { action : 'WorkflowController@logoutUser' }
  }
};
