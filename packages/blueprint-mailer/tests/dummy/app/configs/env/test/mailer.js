const nodemailer = require ('nodemailer');
const mg = require ('nodemailer-mailgun-transport');
const mailgun = require ('./mailgun');

module.exports = {
  // Preview all emails.
  preview: true,

  message: {
    // Default sender for all emails.
    from: 'no-reply@donatians.com'
  },

  // Using the mailgun transport. You can configure the mailer service to use
  // any transport that you like.
  transport: nodemailer.createTransport (mg (mailgun))
};
