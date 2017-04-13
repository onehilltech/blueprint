'use strict';

var async = require ('async')
  , gcm   = require ('node-gcm')
  , _     = require ('underscore')
  , util  = require ('util')
  , debug = require ('debug') ('blueprint:messaging:sender')
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
  debug ('sending message to ' + util.inspect (recipients));

  if (!_.isArray (recipients))
    recipients = [recipients];

  async.waterfall ([
    // Get the tokens for all recipients.
    function (callback) {
      var filter = { owner: {$in: recipients} };
      this._model.distinct ('token', filter, callback);
    }.bind (this),

    function (tokens, callback) {
      var message = new gcm.Message ({
        dryRun : this._dryRun,
        data : data
      });

      var i = 0;

      async.whilst (
        function () { return i < tokens.length; },
        function (callback) {
          // Get the next N recipients, and send them the message.
          var currTokens = tokens.slice (i, i + MAX_RECIPIENTS);
          var recipient = { registrationTokens: currTokens };

          async.waterfall ([
            function (callback) {
              this.sendMessage (recipient, message, callback);
            }.bind (this),

            function (res, callback) {
              // Move the next set of recipients
              i += currTokens.length;

              return callback (null, res);
            }
          ], callback);
        }.bind (this),
        callback);
    }.bind (this)
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
  debug ('publishing message to ' + topic);

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
  async.waterfall ([
    /*
     * Send the message to the cloud service.
     */
    function (callback) {
      this._sender.send (message, recipient, callback);
    }.bind (this),

    function (res, callback) {
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
            this._model.remove ({token: {$in: badTokens}}, callback);
          }.bind (this));
        }
      }

      async.series (finishTasks, function (err) {
        return callback (err, res);
      });
    }.bind (this)
  ], callback);
};
