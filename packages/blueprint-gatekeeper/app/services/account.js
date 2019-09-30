const {
  Service
} = require ('@onehilltech/blueprint');

module.exports = Service.extend ({
  init () {
    this._super.call (this, ...arguments);
  },

  prepareId (doc) {
    return doc;
  }
});