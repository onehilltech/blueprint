var winston       = require ('winston')
  , blueprint     = require ('@onehilltech/blueprint')
  , messaging     = blueprint.messaging
  , nodemailer    = require ('nodemailer')
  , EmailTemplate = require ('email-templates').EmailTemplate
  , path          = require ('path')
  , util          = require ('util')
  ;

// TODO Construct the real location of the template directory.
var templateDir = path.resolve (__dirname, '../../resources/email-templates/account.activation');
var activationEmail = new EmailTemplate (templateDir);

const DEFAULT_STYLE = {
  primaryColor: '#2196F3'
};

var appConfig;
var gatekeeperConfig;
var activationConfig;
var transport;

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
  gatekeeperConfig = app.configs.gatekeeper;
  activationConfig = gatekeeperConfig || {};

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
  if (!transport || !activationConfig.required)
    return;

  var email = account.email;

  var data = {
    appName: appConfig.name,
    gatekeeperBaseUri: gatekeeperConfig.baseuri,
    twitterHandle: gatekeeperConfig.email.twitterHandle,
    style: gatekeeperConfig.email.style || DEFAULT_STYLE,
    account: {
      id: account.id,
      token: account.activation.token
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

    transport.sendMail (mailOptions, function (err, info){
      if (err) return winston.log ('error', 'failed to send email: ' + err.message);
      messaging.emit ('gatekeeper.email.account_activation.sent', account, info);
    });
  });
}

exports = module.exports = sendActivationEmail;
