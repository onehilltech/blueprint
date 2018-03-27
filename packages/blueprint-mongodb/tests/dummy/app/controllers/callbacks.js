const ResourceController = require ('../../../../lib/resource-controller');
const Author = require ('../models/author');

module.exports = ResourceController.extend ({
  model: Author,

  createCallbacks: [],

  create () {
    return this._super.create.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        this.controller.createCallbacks = ['prepareDocument'];
        return this._super.apply (this, arguments);
      },

      preCreateModel () {
        this.controller.createCallbacks.push ('preCreateModel');
        return this._super.apply (this, arguments);
      },

      createModel () {
        this.controller.createCallbacks.push ('createModel');
        return this._super.apply (this, arguments);
      },

      postCreateModel () {
        this.controller.createCallbacks.push ('postCreateModel');
        return this._super.apply (this, arguments);
      },

      prepareResponse () {
        this.controller.createCallbacks.push ('prepareResponse');
        return this._super.apply (this, arguments);
      }
    })
  }
});
