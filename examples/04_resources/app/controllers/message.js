const {
  Action,
  ResourceController
} = require ('@onehilltech/blueprint');

module.exports = ResourceController.extend ({
  name: 'message',

  // In-memory list of messages.
  _messages: null,

  init () {
    this._super.apply (this, arguments);
    this._messages = [];
  },

  create () {
    return Action.extend ({
      schema: {
        'message.title': {
          in: 'body',
          isLength: {
            options: { min: 1 }
          },
          trim: true
        },

        'message.content': {
          in: 'body',
          isLength: {
            options: { min: 1 }
          },
          trim: true,
        }
      },

      execute (req, res) {
        let {title,content} = req.body.message;
        let id = this.controller._messages.length;
        let model = {id, title, content, timestamp: new Date ()};

        this.controller._messages.push (model);

        res.status (200).json ({message: model});
      }
    });
  },

  getAll () {
    return Action.extend ({
      execute (req, res) {
        res.status (200).json ({messages: this.controller._messages});
      }
    });
  },

  delete () {
    return Action.extend ({
      schema: {
        [this.id]: {
          in: 'params',
          toInt: true
        }
      },

      execute (req, res) {
        let messageId = req.params.messageId;
        let index = this.controller._messages.findIndex (value => value.id === messageId);

        if (index === -1)
          return res.status (200).json (false);

        this.controller._messages.splice (index, 1);
        res.status (200).json (true);
      }
    });
  }
});
