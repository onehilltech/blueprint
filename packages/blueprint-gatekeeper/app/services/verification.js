/*
 * Copyright (c) 2021 One Hill Technologies, LLC
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

const { Service, service, model } = require ('@onehilltech/blueprint');

module.exports = Service.extend ({
  // Reference to the gatekeeper service for sending emails.
  gatekeeper: service (),

  // Reference to the account model.
  Account: model ('account'),

  /// The token generator used for the service to generate/verify tokens.
  _tokenGenerator: null,

  /// Reference to the mailer service.
  mailer: service (),

  /**
   * Configure the service.
   */
  configure () {
    this._tokenGenerator = this.app.lookup ('service:gatekeeper').makeTokenGenerator ({
      subject: 'account.verification',
    });
  },

  /**
   * Generate a verification token for the account targeting the specified client.
   *
   * @param account
   * @param client
   */
  async generateToken (account, client) {
    if (!client.enabled)
      throw new Error ('The client is disabled.');

    return this._tokenGenerator.generateToken ({ },{ jwtid: account.id, expiresIn: client.verify_expires_in });
  },

  /**
   * Send an email to the user so they can verify their account.
   *
   * @param account
   * @param client
   * @returns {Promise<unknown>}
   */
  async sendEmail (account, client) {
    if (!client.verify_account_url)
      throw new Error ('The client does not support account verification.');

    // Send an email to the user so they can verify their account.
    const token = await this.generateToken (account, client);
    let url = `${client.verify_account_url}?token=${token}`;

    if (!!client.verify_account_redirect_url)
      url += `&redirect=${encodeURIComponent (client.verify_account_redirect_url)}`;

    const email = await this.mailer.send ('gatekeeper.account.verification', {
        message: {
          to: account.email
        },
        locals: {
          verification: {
            url,
            button: {label: 'Verify'}
          }
        }
      });

    // Log the result of sending the activation email to the user for the newly
    // created account.

    account.verification.last_email = email._id;
    account.verification.last_email_date = email.date;

    return account.save ();
  },

  /**
   * Verify an account.
   *
   * @param token       Token for the account to verify
   * @param req         Source request object
   * @returns {Promise<*>}
   */
  async verify (token, req) {
    const payload = await this._tokenGenerator.verifyToken (token);
    const account = await this.Account.findById (payload.jti);

    // Let's make sure the account exist, the account is not disabled, and
    // the account has not been verified.
    if (!account)
      throw new Error ('The account is unknown.');

    if (!account.enabled)
      throw new Error ('The account is disabled.');

    if (!!account.verification.date)
      throw new Error ('The account has already been verified.');

    // Save the verification details.
    account.verification.date = new Date ();

    if (req)
      account.verification.ip_address = req.ip;

    return account.save ();
  }
});