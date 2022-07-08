const { Service, computed } = require ('@onehilltech/blueprint');
const formData = require ('form-data');
const Mailgun = require ('mailgun.js');
const mailgun = new Mailgun (formData);
const { mapValues } = require ('lodash');
const { props } = require ('bluebird');

/**
 * @class mailgun
 */
module.exports = Service.extend ({
  async configure () {
    const { mailgun } = this.app.configs;

    if (!mailgun)
      return;

    const { url, auth = {}, webhooks } = mailgun;
    const { key, api_key, domain } = auth;

    this._mg = mailgun.client ({username: 'api', key: key || api_key, url });
    this._domain = domain;

    if (webhooks)
      await this._configureWebhooks (webhooks);
  },

  domain: computed ({
    get () { return this._domain }
  }),

  webhooks: computed ({
    get () { return this._mg.webhooks; }
  }),

  /**
   * Configure webhooks we get notifications about the emails.
   *
   * @param webhooks      List of webhooks to configure.
   * @private
   */
  async _configureWebhooks (webhooks) {
    const results = mapValues (webhooks, async (webhook, id) => await this._mg.webhooks.create (this.domain, id, webhook.url, true));
    return props (results);
  },
});
