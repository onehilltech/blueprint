module.exports = {
  baseuri : 'http://localhost:5000/gatekeeper',

  email : {
    from : 'noreply@onehilltech.com',
    twitterHandle: 'onehilltech',

    nodemailer : {
      transport: 'stub'
    }
  }
};
