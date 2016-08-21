var blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.errors.HttpError
  ;

var Message = require ('../models/Message')
  ;

function MessageController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (MessageController);

MessageController.prototype.getMessages = function () {
  return {
    execute: function (req, res, callback) {
      Message.find ({}, '-__v', function (err, msgs) {
        if (err) return callback (new HttpError (500, 'Cannot retrieve messages'));

        res.status (200).json (msgs);
        return callback (null);
      });
    }
  };
};

MessageController.prototype.getMessage = function () {
  return {
    validate: function (req, callback) {
      req.checkParams ('messageId', 'Missing/invalid message id').notEmpty ().isMongoId ();
      return callback (req.validationErrors (true));
    },

    sanitize: function (req, callback) {
      req.sanitizeParams ('messageId').toMongoId ();
      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var messageId = req.params.messageId;

      Message.findById (messageId, '-__v', function (err, msg) {
        if (err) return callback (new HttpError (500, 'Failed to retrieve message'));
        if (!msg) return callback (new HttpError (404, 'Message not found'));

        res.status (200).json (msg);
        return callback (null);
      });
    }
  };
};

MessageController.prototype.postMessage = function () {
  var self = this;

  return {
    validate: function (req, callback) {
      req.checkBody ('title', 'required').notEmpty ();
      req.checkBody ('content', 'required').notEmpty ();

      return callback (req.validationErrors (true));
    },

    sanitize: function (req, callback) {
      req.sanitizeBody ('title').escape ().trim ();
      req.sanitizeBody ('content').escape ().trim ();

      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var msg = new Message ({
        title: req.body.title,
        content: req.body.content
      });

      msg.save (function (err, msg) {
        if (err) return callback (new HttpError (500, 'Failed to save message'));

        res.status (200).json (msg.id);
        return callback (null);
      });
    }
  };
};

MessageController.prototype.deleteMessage = function () {
  return {
    validate: function (req, callback) {
      req.checkParams ('messageId', 'Missing/invalid message id').notEmpty ().isMongoId ();
      return callback (req.validationErrors (true));
    },

    sanitize: function (req, callback) {
      req.sanitizeParams ('messageId').toMongoId ();
      return callback (req.validationErrors (true));
    },

    execute: function (req, res, callback) {
      var messageId = req.params.messageId;

      Message.remove ({_id : messageId}, function (err) {
        if (err) return callback (new HttpError (500, 'Failed to delete message'));

        res.status (200).json (true);
        return callback (null);
      });
    }
  };
};

module.exports = exports = MessageController;
