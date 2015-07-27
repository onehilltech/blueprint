exports.auth   = require ('./authentication');
exports.models = require ('./models');

var ApiRouter  = require ('./router/api')
  ;

exports.Router = function () {
  return new ApiRouter ().makeRouter ();
};
