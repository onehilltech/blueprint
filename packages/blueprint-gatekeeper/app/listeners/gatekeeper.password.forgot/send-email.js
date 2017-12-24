const blueprint = require ('@onehilltech/blueprint');
const messaging = blueprint.messaging;
const path  = require ('path');
const async = require ('async');
const Email = require ('email-templates');
const ResetPasswordTokenGenerator = require ('../../utils/reset-password-token-generator');
const _ = require ('lodash');

// TODO Construct the real location of the template directory.
let templateDir = path.resolve (__dirname, '../../resources/email');
let email = null;

const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

let appConfig;
let gatekeeperConfig;
let tokenGenerator;

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

  if (!gatekeeperConfig.email)
    return console.warn ('gatekeeper.config.js: no email configuration; cannot send reset password emails');

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
  tokenGenerator = new ResetPasswordTokenGenerator ();
});

/**
 * Send the activation email to the account.
 */
module.exports = function (account) {
  // Do not continue if we have no email transport.
  if (!email || !gatekeeperConfig.activationRequired)
    return;

  async.waterfall ([
    function (callback) {
      let payload = {email: account.email};
      let options = {expiresIn: '10m'};

      tokenGenerator.generateToken (payload, options, callback);
    },

    function (token, callback) {
      let opts = {
        template: 'gatekeeper.password.reset',
        message: {
          to: account.email
        },
        locals: _.defaultsDeep ({
          appName: appConfig.name,
          url: gatekeeperConfig['reset-password'].url,
          email: account.email,
          token
        }, {style: DEFAULT_STYLE})
      };

      email.send (opts).then (value => callback (null, value)).catch (err => callback (err));
    },

    function (info, callback) {
      messaging.emit ('gatekeeper.password.reset.email-sent', account, info);
      return callback (null);
    }
  ]);
};
