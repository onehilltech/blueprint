const { Service, service } = require ('@onehilltech/blueprint');

module.exports = Service.extend ({
  issuer: service (),

  gatekeeper: service (),

  sendEmail (account, client) {
    if (!client.activate_account_url) {
      return Promise.resolve (account);
    }

    let options = {
      sub: 'account.activation',
      expiresIn: client.activate_expires_in
    };

    return this.issuer.issueUserToken (account, client, { }, options)
      .then (result => {
        const { access_token: accessToken } = result;

        const emailOptions = {
          template: 'gatekeeper.account.activation',
          message: {
            to: account.email,
          },
          locals: {
            account: {
              activationUrl: `${client.activate_account_url}?access_token=${accessToken}`
            }
          }
        };

        return this.gatekeeper.sendEmail (emailOptions);
      })
      .then (result => {
        // Log the result of sending the activation email to the user for the newly
        // created account.

        const { messageId } = result;

        account.verification.last_email_id = messageId;
        account.verification.last_email_date = new Date ();

        return account.save ();
      });
  }
});