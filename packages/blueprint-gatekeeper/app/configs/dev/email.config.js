module.exports = {
  from : 'no-reply@gatekeeper.com',

  gatekeeper : {
    baseUri : 'http://localhost:5000'
  },

  nodemailer : {
    service: 'mailgun',
    auth: {
      user: 'postmaster@sandbox65709925e109491b9913db8656b6184c.mailgun.org',
      pass: '4fe2b7b252ea56722bacf1c2fd1880dc'
    }
  }
};
