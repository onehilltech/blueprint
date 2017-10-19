'use strict';

const winston  = require ('winston')
  , blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , nodemailer = require ('nodemailer')
  , path  = require ('path')
  , async = require ('async')
  , EmailTemplate = require ('email-templates').EmailTemplate
  , verification  = require ('../../utils/account-verification')
  ;

// TODO Construct the real location of the template directory.
let templateDir = path.resolve (__dirname, '../../resources/email-templates/account.activation');
let activationEmail = new EmailTemplate (templateDir);

const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

let appConfig;
let gatekeeperConfig;
let transport;

/**
 * app.init
 */
messaging.on ('app.init', function (app) {
  if (!app.configs.app)
    throw new Error ('app.config not defined');

  if (!app.configs.gatekeeper)
    throw new Error ('gatekeeper.config not defined');

  // Save the Gatekeeper configuration.
  appConfig = app.configs.app;
  gatekeeperConfig = app.configs.gatekeeper || {};

  if (gatekeeperConfig.email)
    transport = nodemailer.createTransport (gatekeeperConfig.email.nodemailer);
});

/**
 * Send the activation email to the account.
 *
 * @param account
 */
function sendActivationEmail (account) {
  // Do not continue if we have no email transport.
  if (!transport || !gatekeeperConfig.activationRequired)
    return;

  async.waterfall ([
    function (callback) {
      verification.generateToken (account, callback);
    },

    function (token, callback) {
      let data = {
        appName: appConfig.name,
        gatekeeperBaseUri: gatekeeperConfig.baseUrl,
        twitterHandle: gatekeeperConfig.email.twitterHandle,
        style: gatekeeperConfig.email.style || DEFAULT_STYLE,
        account: {
          id: account.id,
          token: token
        }
      };

      activationEmail.render (data, callback);
    },

    function (results, callback) {
      let email = account.email;
      let subject = appConfig.name + ' - Account confirmation';

      let mailOptions = {
        from: gatekeeperConfig.email.from,
        to: email,
        subject: subject,
        text: results.text,
        html: results.html
      };

      // Send an email to the user with the a link to verify the account. The link will
      // contain both the email address and the token for verifying the account.
      winston.log ('info', 'sending account activation email to %s', email);
      transport.sendMail (mailOptions, callback);
    },

    function (info, callback) {
      messaging.emit ('gatekeeper.email.account_activation.sent', account, info);

      return callback (null);
    }
  ]);
}

module.exports = sendActivationEmail;
