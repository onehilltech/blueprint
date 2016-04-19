var uid           = require ('uid-safe')
  , winston       = require ('winston')
  , blueprint     = require ('@onehilltech/blueprint')
  , bm            = blueprint.messaging
  , nodemailer    = require ('nodemailer')
  , EmailTemplate = require ('email-templates').EmailTemplate
  , path          = require ('path')
  , util          = require ('util')
  ;

// TODO Construct the real location of the template directory.
var templateDir = path.resolve (__dirname, '../../resources/email-templates/account.activation');
var activationEmail = new EmailTemplate (templateDir);

const DEFAULT_TOKEN_LENGTH = 40;
const DEFAULT_TOKEN_TTL = 300000;

var emailConfig;
var transporter;

bm.on ('app.init', function (app) {
  if (!app.config.email)
    throw new Error ('email.config not defined');

  transporter = nodemailer.createTransport (app.config.email.nodemailer);
  emailConfig = app.config.email;
});

module.exports = function sendActivationEmail (account) {
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
        gatekeeper : emailConfig.gatekeeper,
        account : {
          id : account.id,
          token : account.internal_use.verification.token
        }
      };

      activationEmail.render (data, function (err, results) {
        if (err)
          return winston.log ('error', util.inspect (err));

        var mailOptions = {
          from: emailConfig.from,
          to: email,
          subject: 'FundAll - Account confirmation',
          text: results.text,
          html: results.html
        };

        // Send an email to the user with the a link to verify the account. The link will
        // contain both the email address and the token for verifying the account.
        winston.log ('info', 'sending account activation email to %s', email);

        transporter.sendMail (mailOptions, function (err, info){
          if (err)
            return winston.log ('error', 'failed to send email: ' + err.message);

          bm.emit ('gatekeeper.email.account_activation.sent', account);
        });
      });
    });
  });
};
