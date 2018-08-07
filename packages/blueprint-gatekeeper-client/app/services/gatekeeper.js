/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { computed, Service } = require ('@onehilltech/blueprint');
const path = require ('path');
const fs = require ('fs-extra');
const request = require ('request-promise-native');

module.exports = Service.extend ({
  /// The current access token for the client.
  _accessToken: null,
  _config: null,

  init () {
    this._super.call (this, ...arguments);
    this._config = this.app.lookup ('config:gatekeeper');
  },

  tempPath: computed ({
    get () {
      return path.resolve (this.app.tempPath, 'gatekeeper');
    }
  }),

  _accessTokenFilename: computed ({
    get () { return path.resolve (this.tempPath, 'access-token.json'); }
  }),

  accessToken: computed ({
    get () { return this._accessToken; }
  }),

  /// The request wrapper for this service.
  _request: null,

  /**
   * Configure the service.
   *
   * The service will make sure the temp directory exists, and then attempt to load
   * the existing access token.
   */
  configure () {
    this._super.call (this, ...arguments);

    return fs.ensureDir (this.tempPath).then (() => {
      return this._loadToken ();
    });
  },

  /**
   * Start the service.
   *
   * If the service has not loaded an access token, then it will request an access token
   * from the server.
   *
   * @return {*}
   */
  start () {
    this._super.call (this, ...arguments);
    return !this._request ? this._requestToken ().then (this._useToken.bind (this)) : null;
  },

  /**
   * Destroy the service.
   *
   * @return {*}
   */
  destroy () {
    this._super.call (this, ...arguments);

    return this._saveTokenToFile ();
  },

  /**
   * Make a protected request. If the request fails because the token has expired, then
   * the service will renew the access token and retry the original request.
   *
   * @param options
   */
  request (options) {
    return this._request (options).catch (err => {
      // If the token has expired, then we are going to request a new access token
      // and then make the request again.
      const {
        errors: [
          {code, status}
        ]
      } = err;

      if (status !== '403' || code !== 'token_expired')
        return Promise.reject (err);

      return this._requestToken ()
        .then (this._useToken.bind (this))
        .then (() => this._request (options));
    });
  },

  /**
   * Read the current access token from the file.
   *
   * @return {*}
   * @private
   */
  _loadToken () {
    return fs.exists (this._accessTokenFilename)
      .then (exists => exists ? fs.readJson (this._accessTokenFilename) : null)
      .then (this._useToken.bind (this));
  },

  /**
   * Request an access token from the server.
   *
   * @private
   */
  _requestToken () {
    const {
      baseUrl,
      clientId: client_id,
      clientSecret: client_secret
    } = this._config;

    return request ({
      method: 'POST',
      baseUrl,
      url: '/oauth2/token',
      json: true,
      body: {
        grant_type: 'client_credentials',
        client_id,
        client_secret
      }
    });
  },

  /**
   * Use the specified token.
   *
   * @private
   */
  _useToken (accessToken = null) {
    this._accessToken = accessToken;

    if (!this._accessToken)
      return this._removeTokenFile ();

    this._request = request.defaults ({
      headers: {
        Authorization: `Bearer ${this._accessToken.access_token}`
      }
    });

    return this._saveTokenToFile ();
  },

  /**
   * Remove the token file.
   *
   * @private
   */
  _removeTokenFile () {
    return fs.exists (this._accessTokenFilename).then (exists => exists ? fs.unlink (this._accessTokenFilename) : null);
  },

  /**
   * Save the access token to a file.
   *
   * @private
   */
  _saveTokenToFile () {
    return !!this._accessToken ? fs.writeJson (this._accessTokenFilename, this._accessToken) : Promise.resolve ();
  }
});
