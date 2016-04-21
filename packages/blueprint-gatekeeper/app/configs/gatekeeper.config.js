module.exports = {
  baseuri : 'http://localhost:5000/gatekeeper',

  email : {
    from : 'noreply@onehilltech.com',
    twitterHandle: 'onehilltech',

    nodemailer : {
      service: 'mailgun',
      auth: {
        api_key: 'key-af8e0d976bc823c09b77d5f6892ae14b',
        domain: 'sandbox65709925e109491b9913db8656b6184c.mailgun.org'
      }
    }
  }
};
