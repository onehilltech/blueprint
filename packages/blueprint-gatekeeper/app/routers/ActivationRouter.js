var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  // Define the different account routes. We are going to protect all routes
  // under the /accounts base uri.
  '/activate' : {
    get : {action: 'ActivationController@activateAccount'},
  }
};
