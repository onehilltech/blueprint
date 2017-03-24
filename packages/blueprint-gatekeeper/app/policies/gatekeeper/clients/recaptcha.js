'use strict';

const request = require ('request')
  , async     = require ('async')
  ;

module.exports = function (req, callback) {
  async.waterfall ([
    /*
     * Verify the site with Google.
     */
    function (callback) {
      var options = {
        method: 'GET',
        url: 'https://www.google.com/recaptcha/api/siteverify',
        json: true,
        qs: {
          secret: req.client.recaptcha_secret,
          response: req.body.recaptcha,
          remoteip: req.connection.remoteAddress
        }
      };

      request (options, callback);
    },

    function (response, body, callback) {
      if (response.statusCode === 200) {
        if (body.success)
          return callback (null, true);

        return callback (new HttpError (400, 'recaptcha_failed', 'Failed to verify site', {reasons: body['error-codes']}));
      }
      else {
        return callback (new HttpError (400, 'recaptcha_failed', 'Failed to verify site'));
      }
    }
  ], callback);
};
