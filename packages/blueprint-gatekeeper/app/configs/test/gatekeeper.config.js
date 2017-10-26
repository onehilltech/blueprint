'use strict';

const nodemailer = require ('nodemailer')
  , mailgun      = require ('nodemailer-mailgun-transport')
  ;

let auth = {
  auth: {
    api_key: 'key-af8e0d976bc823c09b77d5f6892ae14b',
    domain: 'mg.onehilltech.com'
  }
};

module.exports = {
  email : {
    send: true,
    transport: nodemailer.createTransport (mailgun (auth))
  }
};
