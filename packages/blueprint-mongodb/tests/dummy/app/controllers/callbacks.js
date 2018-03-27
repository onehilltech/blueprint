const ResourceController = require ('../../../../lib/resource-controller');
const Author = require ('../models/author');

module.exports = ResourceController.extend ({
  model: Author,

  createdCallbacks: [],

  create () {
    return this._super.create.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        this.controller.createdCallbacks = ['prepareDocument'];
        return this._super.apply (this, arguments);
      },

      preCreateModel () {
        this.controller.createdCallbacks.push ('preCreateModel');
        return this._super.apply (this, arguments);
      },

      createModel () {
        this.controller.createdCallbacks.push ('createModel');
        return this._super.apply (this, arguments);
      },

      postCreateModel () {
        this.controller.createdCallbacks.push ('postCreateModel');
        return this._super.apply (this, arguments);
      },

      prepareResponse () {
        this.controller.createdCallbacks.push ('prepareResponse');
        return this._super.apply (this, arguments);
      }
    })
  }
});
