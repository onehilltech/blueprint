var uid           = require ('uid-safe')
  , winston       = require ('winston')
  , blueprint     = require ('@onehilltech/blueprint')
  , bm            = blueprint.messaging
  , nodemailer    = require ('nodemailer')
  , EmailTemplate = require ('email-templates').EmailTemplate
  , path          = require ('path')
  , util          = require ('util')
  , mailgun       = require('nodemailer-mailgun-transport')
  ;

// TODO Construct the real location of the template directory.
var templateDir = path.resolve (__dirname, '../../resources/email-templates/account.activation');
var activationEmail = new EmailTemplate (templateDir);

const DEFAULT_TOKEN_LENGTH = 40;
const DEFAULT_TOKEN_TTL = 300000;
const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

var appConfig;
var gatekeeperConfig;
var transporter;

/**
 * app.init
 */
bm.on ('app.init', function (app) {
  if (!app.config.app)
    throw new Error ('app.config not defined');

  if (!app.config.gatekeeper)
    throw new Error ('gatekeeper.config not defined');

  // Save the Gatekeeper configuration.
  appConfig = app.config.app;
  gatekeeperConfig = app.config.gatekeeper;

  transporter = nodemailer.createTransport (mailgun (gatekeeperConfig.email.nodemailer));
});

/**
 * Send the activation email to the account.
 *
 * @param account
 */
function sendActivationEmail (account) {
  // Do not continue if we have no email configuration.
  if (!gatekeeperConfig.email)
    return;

  var email = account.profile.email;

  uid (DEFAULT_TOKEN_LENGTH, function (err, token) {
    if (err)
      return winston.log ('error', util.inspect (err));

    // Calculate when the token expires. It has a time-to-live of 5 minutes. After
    // 5 minutes, the token is expired.
    var expires_at = new Date (Date.now () + DEFAULT_TOKEN_TTL);

    account.internal_use.verification.token.value = token;
    account.internal_use.verification.token.expires_at = expires_at;

    // Save the verification token to the database.
    account.save (function (err, account) {
      if (err)
        return winston.log ('error', util.inspect (err));

      var data = {
        appName: appConfig.name,
        gatekeeperBaseUri: gatekeeperConfig.baseuri,
        twitterHandle: gatekeeperConfig.email.twitterHandle,
        style: gatekeeperConfig.email.style || DEFAULT_STYLE,
        account: {
          id: account.id,
          token: account.internal_use.verification.token
        }
      };

      activationEmail.render (data, function (err, results) {
        if (err)
          return winston.log ('error', util.inspect (err));

        var subject = appConfig.name + ' - Account confirmation';

        var mailOptions = {
          from: gatekeeperConfig.email.from,
          to: email,
          subject: subject,
          text: results.text,
          html: results.html
        };

        // Send an email to the user with the a link to verify the account. The link will
        // contain both the email address and the token for verifying the account.
        winston.log ('info', 'sending account activation email to %s', email);

        transporter.sendMail (mailOptions, function (err, info){
          if (err)
            return winston.log ('error', 'failed to send email: ' + err.message);

          bm.emit ('gatekeeper.email.account_activation.sent', account, info);
        });
      });
    });
  });
}

exports = module.exports = sendActivationEmail;
