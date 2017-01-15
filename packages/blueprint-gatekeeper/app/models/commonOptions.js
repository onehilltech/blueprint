module.exports = function () {
  return {
    toJSON: {
      versionKey: false,
      depopulate: true
    },

    toObject: {
      versionKey: false,
      depopulate: true
    }
  }
};
