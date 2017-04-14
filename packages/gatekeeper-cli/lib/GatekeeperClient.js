'use strict';

var request = require ('request')
  , winston = require ('winston')
  , path    = require ('path')
  , fse     = require ('fs-extra')
  , async   = require ('async')
  , util    = require ('util')
  ;

module.exports = makeClient;

/**
 * Make a new instance of the GatekeeperClient class.
 *
 * @param baseUri
 * @param callback
 */
function makeClient (baseUri, callback) {
  var cwd = process.cwd ();
  var rcFile = path.resolve (cwd, '.gatekeeper/gatekeeper-cli');

  async.waterfall ([
    function (callback) { fse.readJSON (rcFile, callback); },
    function (config, callback) {
      return newInstance ({
        baseUri: baseUri,
        clientId: config.client_id,
        clientSecret: config.client_secret
      }, callback);
    }
  ], callback);
}

/**
 * Factory method that creates a new GatekeeperClient object.
 *
 * @param opts
 * @param callback
 */
function newInstance (opts, callback) {
  opts = opts || {};

  if (opts.baseUri === undefined)
    return callback (new Error ('baseUri is not defined'));

  if (opts.clientId === undefined)
    return callback (new Error ('clientId is not defined'));

  if (opts.clientSecret === undefined)
    return callback (new Error ('clientSecret is not defined'));

  var data = {
    grant_type : 'client_credentials',
    client_id : opts.clientId,
    client_secret : opts.clientSecret
  };

  var url = opts.baseUri + '/v1/oauth2/token';
  request ({url: url, method: 'POST', json: data}, function (err, res, body) {
    if (err)
      return callback (err);

    if (res.statusCode !== 200)
      return callback (new Error (body));

    var token = body.access_token;
    var client = new GatekeeperClient (opts, token);

    return callback (null, client);
  });
}

/**
 * @class GatekeeperClient
 *
 * @param opts
 * @param token
 * @constructor
 */
function GatekeeperClient (opts, token) {
  this.clientId = opts.clientId;
  this.baseUri  = opts.baseUri;
  this.clientToken = token;
}

/**
 * Add a new client to the service.
 *
 * @param opts
 * @param callback
 * @returns {*}
 */
GatekeeperClient.prototype.createClient = function (client, callback) {
  var url = this.getCompleteUrl ('/clients');
  var req = this.makeRequest ({url: url, method: 'POST', json: {client: client}});

  return request (req, handleResponse (callback));
};

/**
 * Remove a client's access to the service.
 *
 * @param clientId
 * @param callback
 * @returns {*}
 */
GatekeeperClient.prototype.deleteClient = function (clientId, callback) {
  var url = this.getCompleteUrl ('/clients/' + clientId);
  var req = this.makeRequest ({url: url, method: 'DELETE'});

  return request (req, handleResponse (callback));
};

/**
 * Add a new account to the service.
 *
 * @param opts
 * @param callback
 */
GatekeeperClient.prototype.addAccount = function (opts, callback) {
  var url = this.getCompleteUrl ('/accounts');

  var data = {
    username : opts.username,
    password : opts.password,
    email : opts.email
  };

  if (opts.scope)
    data.scope = opts.scope;

  var req = this.makeRequest ({url: url, method: 'POST', json: {account: data}});
  request (req, handleResponse (callback));
};

/**
 * Delete an existing account from the service.
 *
 * @param accountId
 * @param callback
 * @returns {*}
 */
GatekeeperClient.prototype.deleteAccount = function (accountId, callback) {
  var url = this.getCompleteUrl ('/accounts/' + accountId);
  var req = this.makeRequest ({url: url, method: 'DELETE'});

  return request (req, handleResponse (callback));
};

/**
 * Get the complete Url for a relative path.
 *
 * @param relativePath
 * @returns {*}
 */
GatekeeperClient.prototype.getCompleteUrl = function (relativePath) {
  return this.baseUri + '/v1' + relativePath;
};

/**
 * Make a request object based on the authorization of this client.
 *
 * @param opts
 * @returns {*}
 */
GatekeeperClient.prototype.makeRequest = function (opts) {
  if (!opts.headers)
    opts.headers = {};

  opts.headers['Authorization'] = 'Bearer ' + this.clientToken;
  return opts;
};

function handleResponse (callback) {
  return function (err, res, body) {
    if (err) return callback (err);
    if (res.statusCode < 200 || res.statusCode >= 400) return callback (new Error (util.inspect (body)));
    return callback (null, body);
  }
}
