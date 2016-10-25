'use strict';

var async = require ('async')
  , gcm   = require ('node-gcm')
  , _     = require ('underscore')
  ;

const MAX_RECIPIENTS = 1000;

const ERROR_NOT_REGISTERED = 'NotRegistered';

module.exports = Sender;

function Sender (model, opts) {
  opts = opts || {};

  if (!opts.apiKey)
    throw new Error ('Missing apiKey option');

  this._dryRun = opts.dryRun || false;
  this._sender = gcm.Sender (opts.apiKey);
  this._model = model;
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
      self._model.distinct ('token', filter, callback);
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
          var currTokens = tokens.slice (i, i + MAX_RECIPIENTS);
          var recipient = { registrationTokens: currTokens };

          self.sendMessage (recipient, message, function (err, res) {
            if (err)
              return callback (err);

            // Move the next set of recipients
            i += currTokens.length;

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
  var self = this;

  this._sender.send (message, recipient, function (err, res) {
    if (err) return callback (err);

    var finishTasks = [];

    if (res.failure > 0 && recipient.registrationTokens) {
      // There were some failures. We need to check what the failure is, and
      // remove registration information if the id is not registered.

      var tokens = recipient.registrationTokens;
      var badTokens = [];

      res.results.forEach (function (result, index) {
        if (result.error === ERROR_NOT_REGISTERED) {
          badTokens.push (tokens[index]);
        }
      });

      if (badTokens.length > 0) {
        // Remove all tokens from the database with the bad ids.
        finishTasks.push (function (callback) {
          self._model.remove ({token: {$in: badTokens}}, callback);
        });
      }
    }

    async.series (finishTasks, function (err) {
      return callback (err, res);
    });
  });
};
