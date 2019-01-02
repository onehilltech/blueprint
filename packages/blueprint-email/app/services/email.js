const { computed, Service } = require ('@onehilltech/blueprint');
const Email = require ('email-templates');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const { merge } = require ('lodash');
const path = require ('path');

/**
 * @class EmailService
 *
 * A service that manages the sending of transaction email via Mailgun.
 */
module.exports = Service.extend ({
  /// The instance of the email facade.
  _email: null,
  _defaultOptions: null,

  templatePath: computed ({
    get () {
      return path.resolve (this.app.module.assetsPath, 'templates/email');
    }
  }),

  init () {
    this._super.call (this, ...arguments);

    this._defaultOptions = {
      views: {
        root: this.templatePath
      }
    };

    // Load the configuration, and create a transport if one does not exist.
    let config = this.app.lookup ('config:email');
    config = merge (this._defaultOptions, config);

    if (!config.transport)
      config.transport = this._createTransport ();

    this._email = new Email (config);
  },

  send (email) {
    return this._email.send (email);
  },

  _createTransport () {
    const config = this.app.lookup ('config:mailgun');
    return nodemailer.createTransport (mg (config));
  }
});
