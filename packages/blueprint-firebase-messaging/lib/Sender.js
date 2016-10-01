var async      = require ('async')
  , gcm        = require ('node-gcm')
  , CloudToken = require ('../app/models/CloudToken')
  , _          = require ('underscore')
  ;

const MAX_RECIPIENTS = 1000;

function Sender (opts) {
  opts = opts || {};

  if (!opts.apiKey)
    throw new Error ('Missing apiKey option');

  this._dryRun = opts.dryRun || false;
  this._sender = gcm.Sender (opts.apiKey);
}

/**
 * Send a data message to a set of recipients.
 *
 * @param recipients
 * @param data
 * @param callback
 */
Sender.prototype.send = function (recipients, data, callback) {
  var self = this;

  if (!_.isArray (recipients))
    recipients = [recipients];

  async.waterfall ([
    // Get the tokens for all recipients.
    function (callback) {
      var filter = { owner: {$in: recipients} };
      CloudToken.distinct ('token', filter, callback);
    },

    function (tokens, callback) {
      var message = new gcm.Message ({
        dryRun : self._dryRun,
        data : data
      });

      var i = 0;

      async.whilst (
        function () { return i < tokens.length; },
        function (callback) {
          // Get the next N recipients, and send them the message.
          var recipient = {
            registrationTokens: tokens.slice (i, i + MAX_RECIPIENTS)
          };

          self.sendMessage (recipient, message, function (err, res) {
            if (err) return callback (err);

            // Move the next set of recipients
            i += recipient.registrationTokens.length;

            return callback (null, res);
          })
        },
        callback);
    }
  ], callback);
};

/**
 * Publish data to a topic.
 *
 * @param topic
 * @param data
 * @param callback
 */
Sender.prototype.publish = function (topic, data, callback) {
  var message = new gcm.Message ({
    dryRun : this._dryRun,
    data : data
  });

  var recipient = {};

  if (topic[0] === '/')
    recipient.topic = topic;
  else
    recipient.condition = topic;

  this.sendMessage (recipient, message, callback);
};

/**
 * Wrapper method for node-gcm Sender.send ().
 *
 * @param recipient
 * @param message
 * @param callback
 */
Sender.prototype.sendMessage = function (recipient, message, callback) {
  this._sender.send (message, recipient, function (err, res) {
    if (err) return callback (err);

    // TODO Check res.failure and res.result for failures to resolve bad registrations.

    return callback (err, res);
  });
};

module.exports = exports = Sender;
