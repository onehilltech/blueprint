const request = require ('request')
  , async     = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.HttpError
  ;

const VERIFY_METHOD = 'GET';
const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Check the policy for a Google ReCAPTCHA client. The request must include
 * a recaptcha value that is combined with the client's recaptcha secret and
 * verified via Google.
 *
 * @param req
 * @param callback
 */
module.exports = function (req, callback) {
  async.waterfall ([
    /*
     * Verify the site with Google.
     */
    function (callback) {
      var options = {
        method: VERIFY_METHOD,
        url: VERIFY_URL,
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
