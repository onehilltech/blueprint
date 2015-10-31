var uid           = require ('uid-safe')
  , winston       = require ('winston')
  , blueprint     = require ('blueprint')
  , email         = require ('emailjs')
  , EmailTemplate = require ('email-templates').EmailTemplate
  ;

// TODO Construct the real location of the template directory.
var templateDir = path.join (__dirname, 'email-templates', 'account-verification')
var verifyEmail = new EmailTemplate (templateDir);

const DEFAULT_TOKEN_LENGTH = 128;
const DEFAULT_TOKEN_TTL = 300000;

var emailConfig;

blueprint.on ('app.init', function (app) {
  if (!app.config.email)
    throw new Error ('email.config not defined');

  emailConfig = app.config.email;
});

module.exports = function sendVerificationEmail (account) {
  winston.log ('info', 'sending account verification email to %s', account.email);

  uid (DEFAULT_TOKEN_LENGTH, function (err, token) {
    if (err)
      return winston.log ('error', err);

    // Calculate when the token expires. It has a time-to-live of 5 minutes. After
    // 5 minutes, the token is expired.
    var expires_at = Date.now () + DEFAULT_TOKEN_TTL;

    account.verification.token.value = token;
    account.verification.token.expires_at = expires_at;

    // Save the verification token to the database.
    account.save (function (err, account) {
      if (err)
        return winston.log ('error', err);

      var data = {
        email : account.email,
        token : account.verification.token
      };

      verifyEmail.render (data, function (err, results) {
        var message = {
          text : results.text,
          from : emailConfig.from,
          to : account.email,
          subject : "Account Verification",
          attachment:
            [
              {data :results.html, alternative:true}
            ]
        };

        // Send an email to the user with the a link to verify the account. The link will contain
        // both the email address and the token for verifying the account.
        var server = email.server.connect (smtp);

        server.send (message, function (err, message) {
          if (err)
            return winston.log ('error', err);

          winston.log ('info', 'account verification email sent to %s', account.email);
        });
      });
    });
  });
};
