var blueprint = require ('@onehilltech/blueprint')
  ;

var Message = require ('../models/Message')
  ;

function MessageController () {
  blueprint.BaseController.call (this);
}

blueprint.controller (MessageController);

MessageController.prototype.setMessageId = function (callback) {
  return function (req, res, next, param) {
    req.messageId = param;
    return next ();
  };
};

MessageController.prototype.getMessages = function (callback) {
  var self = this;

  return function (req, res) {
    Message.find ({}, '-__v', function (err, msgs) {
      if (err)
        return self.handleError (err, res, 500, 'Cannot retrieve messages', callback);

      if (!msgs || msgs.length === 0)
        return res.status (200).json ([]);

      return res.status (200).json (msgs);
    });
  };
}

MessageController.prototype.getMessage = function (callback) {
  var self = this;

  return function (req, res) {
    Message.findById (req.messageId, '-__v', function (err, msg) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to retreive message', callback);

      if (!msg)
        return self.handleError (err, res, 404, 'Message not found', callback);

      return res.status (200).json (msg);
    });
  };
};

MessageController.prototype.postMessage = function (callback) {
  var self = this;

  return function (req, res) {
    var msg = new Message ({
      title : req.body.title,
      content : req.body.content
    });

    msg.save (function (err, msg) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to save message', callback);

      return res.status (200).json (msg.id);
    });
  };
};

MessageController.prototype.deleteMessage = function (callback) {
  var self = this;

  return function (req, res) {
    Message.remove ({_id : req.messageId}, function (err) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to delete message', callback);

      return res.status (200).json (true);
    });
  };
};

module.exports = exports = MessageController;
