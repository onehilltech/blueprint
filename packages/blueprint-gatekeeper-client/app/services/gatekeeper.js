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
const { merge } = require ('lodash');

module.exports = Service.extend ({
  /// The current access token for the client.
  _accessToken: null,
  _config: null,

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

  _refreshTokenPromise: null,

  /**
   * Configure the service.
   *
   * The service will make sure the temp directory exists, and then attempt to load
   * the existing access token.
   */
  async configure () {
    this._super.call (this, ...arguments);
    this._config = this.app.lookup ('config:gatekeeper');

    await fs.ensureDir (this.tempPath);
    await this._loadToken ();
  },

  /**
   * Start the service.
   *
   * If the service has not loaded an access token, then it will request an access token
   * from the server.
   *
   * @return {*}
   */
  async start () {
    this._super.call (this, ...arguments);

    if (!this._accessToken) {
      const accessToken = await this._requestToken ();
      this._useToken (accessToken);
    }
  },

  /**
   * Destroy the service.
   *
   * @return {*}
   */
  async destroy () {
    this._super.call (this, ...arguments);

    await this._saveTokenToFile ();
  },

  /**
   * Make a protected request. If the request fails because the token has expired, then
   * the service will renew the access token and retry the original request.
   *
   * @param options
   */
  async request (options) {
    if (!!this._accessToken) {
      options = merge (options, {
        headers: {
          Authorization: `Bearer ${this._accessToken.access_token}`
        }
      });
    }

    try {
      return await request (options);
    }
    catch (reason) {
      // If the token has expired, then we are going to request a new access token
      // and then make the request again.

      if (reason.statusCode !== 403)
        throw reason;

      const err = JSON.parse (reason.error);
      const { errors: [{ code }] } = err;

      if (code !== 'token_expired' && code !== 'unknown_token' && code !== 'invalid_token')
        throw err;

      // Refresh the token, then make the request again.
      await this._refreshToken ();
      return this.request (options);
    }
  },

  _refreshToken () {
    if (!!this._refreshTokenPromise)
      return this._refreshTokenPromise;

    this._refreshTokenPromise = new Promise ((resolve, reject) => {
      this._requestToken ()
        .then (this._useToken.bind (this))
        .then (() => this._refreshTokenPromise = null)
        .then (resolve).catch (reject);
    });

    return this._refreshTokenPromise;
  },

  /**
   * Read the current access token from the file.
   *
   * @return {*}
   * @private
   */
  async _loadToken () {
    const exists = await fs.exists (this._accessTokenFilename);

    if (exists) {
      const accessToken = await fs.readJson (this._accessTokenFilename);
      this._useToken (accessToken);
    }
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
    // Remove the old token file if one exists.
    if (!!this._accessToken)
      this._removeTokenFile ();

    // Replace the old token with the new token, and save it to disk.
    this._accessToken = accessToken;

    if (!!this._accessToken)
      return this._saveTokenToFile ();
  },

  /**
   * Remove the token file.
   *
   * @private
   */
  async _removeTokenFile () {
    const exists = await fs.exists (this._accessTokenFilename);

    if (exists)
      await fs.unlink (this._accessTokenFilename);
  },

  /**
   * Save the access token to a file.
   *
   * @private
   */
  async _saveTokenToFile () {
    if (!!this._accessToken)
      await fs.writeJson (this._accessTokenFilename, this._accessToken, { spaces: 2 });
  }
});
