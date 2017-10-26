'use strict';

const blueprint  = require ('@onehilltech/blueprint')
  , messaging    = blueprint.messaging
  , path         = require ('path')
  , async        = require ('async')
  , Email        = require ('email-templates')
  , verification = require ('../../utils/account-verification')
  , _            = require ('lodash')
  ;

// TODO Construct the real location of the template directory.
let templateDir = path.resolve (__dirname, '../../resources/email');
let email = null;

const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

let appConfig;
let gatekeeperConfig;

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

  // Create the email template for the activation email while preventing the
  // application from changing the location of the email templates.
  let defaults = {
    views: {
      options: {
        extension: 'ejs'
      }
    }
  };

  let overrides = {
    views: {
      root: templateDir
    }
  };

  let opts = _.merge (defaults, _.omit (gatekeeperConfig.email, ['locals']), overrides);

  email = new Email (opts);
});

/**
 * Send the activation email to the account.
 *
 * @param account
 */
function sendActivationEmail (account) {
  // Do not continue if we have no email transport.
  if (!email || !gatekeeperConfig.activationRequired)
    return;

  async.waterfall ([
    function (callback) {
      verification.generateToken (account, callback);
    },

    function (token, callback) {
      let opts = {
        template: 'account.activation',
        message: {
          to: account.email
        },
        locals: _.defaultsDeep ({
          appName: appConfig.name,
          gatekeeperBaseUri: gatekeeperConfig.baseUrl,
          account: {
            id: account.id,
            verificationToken: token
          }
        }, gatekeeperConfig.email.locals, {style: DEFAULT_STYLE})
      };

      email.send (opts).then (value => callback (null, value)).catch (err => callback (err));
    },

    function (info, callback) {
      messaging.emit ('gatekeeper.email.account_activation.sent', account, info);
      return callback (null);
    }
  ]);
}

module.exports = sendActivationEmail;
