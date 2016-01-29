var request = require ('request')
  , winston = require ('winston')
  ;

function GatekeeperClient (opts, token) {
  this.clientId = opts.clientId;
  this.baseUri  = opts.baseUri;
  this.clientToken = token;
}

/**
 * Create an account.
 *
 * @param opts
 * @param callback
 */
GatekeeperClient.prototype.createAccount = function (opts, callback) {
  var url = this.getCompleteUrl ('/accounts');

  var data = {
    username : opts.username,
    password : opts.password,
    email : opts.email
  };

  var req = this.makeRequest ({url: url, method: 'POST', json: data});
  request (req, function (err, res, body) {
    if (err)
      throw err;

    if (res.statusCode !== 200)
      throw new Error (body);

    if (body === true)
      winston.log ('info', 'Successfully created account', opts.username);
    else
      winston.log ('error', 'Failed to create account');
  });
};

/**
 * Get the complete Url for a relative path.
 * 
 * @param relativePath
 * @returns {*}
 */
GatekeeperClient.prototype.getCompleteUrl = function (relativePath) {
  return this.baseUri + relativePath;
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

/**
 * Factory method that creates a new GatekeeperClient object.
 *
 * @param opts
 * @param callback
 */
function newInstance (opts, callback) {
  opts = opts || {};

  if (opts.baseUri === undefined)
    throw new Error ('baseUri is not defined');

  if (opts.clientId === undefined)
    throw new Error ('clientId is not defined');

  if (opts.clientSecret === undefined)
    throw new Error ('clientSecret is not defined');

  var data = {
    grant_type : 'client_credentials',
    client_id : opts.clientId,
    client_secret : opts.clientSecret
  };

  var url = opts.baseUri + '/oauth2/token';
  request ({url: url, method: 'POST', json: data}, function (err, res, body) {
    if (err)
      return callback (err);

    if (res.statusCode !== 200)
      return callback (null, new Error (body));

    var token = body.access_token;
    var client = new GatekeeperClient (opts, token);

    return callback (null, client);
  });
}

module.exports = newInstance;