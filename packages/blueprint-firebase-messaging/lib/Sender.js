const async = require ('async');
const gcm   = require ('node-gcm');
const _     = require ('lodash');
const debug = require ('debug') ('blueprint:messaging:sender');

const MAX_RECIPIENTS = 1000;

const ERROR_NOT_REGISTERED = 'NotRegistered';

function Sender (model, opts = {}) {
  if (!opts.apiKey)
    throw new Error ('Missing apiKey option');

  this._dryRun = opts.dryRun || false;
  this._sender = gcm.Sender (opts.apiKey);
  this._model = model;
}

module.exports = Sender;

/**
 * Send a data message to a set of recipients.
 *
 * @param recipients
 * @param data
 * @param callback
 */
Sender.prototype.send = function (recipients, data, callback) {
  debug (`sending message to ${recipients}`);

  if (!_.isArray (recipients))
    recipients = [recipients];

  async.waterfall ([
    // Get the tokens for all recipients.
    (callback) => {
      let selection = { user: {$in: recipients} };

      this._model.find (selection)
        .populate ('user', 'enabled')
        .populate ('client', 'enabled')
        .exec (callback);
    },

    (selection, callback) => {
      // Create a new Firebase message, and only select the models where the client
      // is enabled, and the user is enabled, if applicable. We want to filter the
      // list before we start.
      let message = new gcm.Message ({ dryRun : this._dryRun, data });
      let enabled = selection.filter (device => {
        return device.client.enabled && (!device.user || device.user.enabled);
      });

      let i = 0;

      async.whilst (
        () => { return i < enabled.length; },

        (callback) => {
          // Get the next N recipients, and send them the message.
          let registrationTokens = enabled.slice (i, i + MAX_RECIPIENTS).map (device => device.token);
          let recipient = { registrationTokens };

          async.waterfall ([
            (callback) => {
              this.sendMessage (recipient, message, callback);
            },

            (res, callback) => {
              // Move the next set of recipients
              i += registrationTokens.length;

              return callback (null, res);
            }
          ], callback);
        },
        callback);
    }], callback);
};

/**
 * Publish data to a topic.
 *
 * @param topic
 * @param data
 * @param callback
 */
Sender.prototype.publish = function (topic, data, callback) {
  debug (`publishing message to ${topic}`);

  let message = new gcm.Message ({ dryRun : this._dryRun, data });
  let recipient = {};

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
    (callback) => {
      this._sender.send (message, recipient, callback);
    },

    (res, callback) => {
      let finishTasks = [];

      if (res.failure > 0 && recipient.registrationTokens) {
        // There were some failures. We need to check what the failure is, and
        // remove registration information if the id is not registered.

        let tokens = recipient.registrationTokens;
        let badTokens = [];

        res.results.forEach ((result, index) => {
          if (result.error === ERROR_NOT_REGISTERED) {
            badTokens.push (tokens[index]);
          }
        });

        if (badTokens.length > 0) {
          // Remove all tokens from the database with the bad ids.
          finishTasks.push ((callback) => {
            this._model.remove ({token: {$in: badTokens}}, callback);
          });
        }
      }

      async.series (finishTasks, (err) => { callback (err, res); });
    }
  ], callback);
};
