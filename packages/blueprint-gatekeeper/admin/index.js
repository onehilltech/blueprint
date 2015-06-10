var express = require ('express')
  , models  = require ('../lib/models')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.get = function () {
  var router = express.Router ();

  router.get ('/', function (req, res) {
    res.render ('admin/index');
  });

  router.get ('/clients', function (req, res) {
    res.render ('admin/clients');
  });

  router.get ('/codes', function (req, res) {
    res.render ('admin/codes');

  });

  router.get ('/tokens', function (req, res) {
    models.oauth2.AccessToken.find ({}, function (err, docs) {
      res.render ('admin/tokens', {tokens : docs});
    });
  });

  return router;
};

module.exports = function admin (opts) {
  return new AdminRouter (opts).get ();
};
