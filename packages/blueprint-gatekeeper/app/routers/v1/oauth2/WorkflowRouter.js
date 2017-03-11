var gatekeeper = require ('../../../../lib')
  ;

module.exports = exports = {
  '/token': {
    post: { action: 'oauth2.WorkflowController@issueToken' }
  },

  '/logout' : {
    use: gatekeeper.protect (),
    post: { action : 'oauth2.WorkflowController@logoutUser' }
  }
};
