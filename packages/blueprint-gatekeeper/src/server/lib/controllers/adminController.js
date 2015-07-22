var passport = require ('passport')
  , request  = require ('request')
  , winston  = require ('winston')
  ;

var local  = require ('../authentication/local')
  , config = require ('../../config').get ()
  ;

passport.use (local ());

function AdminController () {

}

AdminController.prototype.getApiUrl = function (req, path, secure) {
  secure = secure || false;

  var protocol = secure ? 'https://' : 'http://';
  var host = req.headers.host;
  var apiHost = host.indexOf ('localhost') === 0 ? host : 'gatekeeper.' + host;

  return protocol + apiHost + path;
}

AdminController.prototype.getClientAccessToken = function (req, done) {
  winston.info ('requesting access token for client');
  var tokenUrl = this.getApiUrl (req, '/api/oauth2/token');

  var postData = {
    grant_type : 'client_credentials',
    client_id : config.oauth2.client_id,
    client_secret : config.oauth2.client_secret
  };

  request.post (tokenUrl, {form : postData}, function (err, res, body) {
    done (err, JSON.parse (body));
  });
};

AdminController.prototype.isLoggedIn = function () {
  return function (req, res, next) {
    if (req.isAuthenticated ())
      return next();

    req.session.returnTo = req.originalUrl || req.url;
    res.redirect ('/admin/login');
  };
}

AdminController.prototype.viewHomePage = function () {
  return function (req, res) {
    return res.render ('views/admin/index');
  };
};

AdminController.prototype.viewLoginPage = function () {
  return function (req, res) {
    return res.render ('views/admin/login')
  };
};

AdminController.prototype.authenticate = function () {
  var opts = {
    successReturnToOrRedirect : '/admin',
    failureRedirect : '/admin/login'
  };

  return passport.authenticate ('local', opts);
};

AdminController.prototype.logout = function () {
  return function (req, res) {
    req.logout ();
    res.redirect ('/admin');
  };
};

AdminController.prototype.renderWithAccessToken = function (req, res, view, data) {
  this.getClientAccessToken (req, function (err, result) {
    if (err)
      return res.status (500).send ();

    data['access_token'] = result.access_token;
    return res.render (view, data);
  });
}

exports = module.exports = AdminController;

