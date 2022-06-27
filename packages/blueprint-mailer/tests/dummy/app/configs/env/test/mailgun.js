const { env } = require ('process');

module.exports = {
  auth: {
    api_key: env.MAILGUN_API_KEY,
    domain: env.MAILGUN_DOMAIN
  },

  webhooks: {
    open: { url: 'http://localhost:8080' }
  }
};
