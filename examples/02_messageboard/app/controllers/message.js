const {
  Action,
  Controller,
  HttpError
} = require ('@onehilltech/blueprint');

const Message = require ('../models/message');

module.exports = Controller.extend ({
  getMessages () {
    return Action.extend ({
      execute (req, res) {
        return Message.find ({}, '-__v').then (messages => res.status (200).json (messages));
      }
    })
  },

  getMessage () {
    return Action.extend ({
      validate: {
        messageId: {
          in: 'params',
          notEmpty: {errorMessage: 'The request is missing an id.'},
          isMongoId: {errorMessage: 'The id is an invalid format.'},
          toMongoId: true
        }
      },

      execute (req, res) {
        const {messageId} = req.params;

        return Message.findById (messageId, '-__v').then (message => {
          if (!message)
            return Promise.reject (new HttpError (404, 'Message not found'));

          res.status (200).json (msg);
        });
      }
    });
  },

  postMessage () {
    return Action.extend ({
      validate: {
        title: {
          in: 'body',
          notEmpty: true,
          trim: true,
          escape: true
        },

        content: {
          in: 'body',
          notEmpty: true,
          trim: true,
          escape: true
        }
      },

      execute (req, res) {
        let {title,content} = req.body;
        let msg = new Message ({title, content});

        return msg.save ().then (msg => {
          res.status (200).json (msg.id);
        });
      }
    });
  },

  deleteMessage () {
    return Action.extend ({
      validate: {
        messageId: {
          in: 'params',
          notEmpty: {errorMessage: 'The request is missing a message id.'},
          isMongoId: {errorMessage: 'Invalid id format.'},
          toMongoId: true
        }
      },

      execute (req, res) {
        const {messageId} = req.params;

        Message.findByIdAndRemove (messageId).then (() => res.status (200).json (true));
      }
    });
  }
});
