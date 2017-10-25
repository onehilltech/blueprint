'use strict';

module.exports = {
  email : {
    nodemailer : {
      streamTransport: true,
      newline: 'unix',
      buffer: true
    }
  }
};
