exports.auth   = require ('./authentication');
exports.models = require ('./models');

var ApiRouter  = require ('./router/api')
  ;

exports.Router = function (mongoose) {
  return new ApiRouter ().makeRouter (mongoose.models);
};
