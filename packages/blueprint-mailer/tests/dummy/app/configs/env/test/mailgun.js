const { env } = require ('process');

module.exports = {
  auth: {
    api_key: env.MAILGUN_API_KEY,
    domain: env.MAINGUN_DOMAIN
  }
};
