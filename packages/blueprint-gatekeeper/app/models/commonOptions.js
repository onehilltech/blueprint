'use strict';

const blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = function () {
  let stats = blueprint.env !== 'test';

  return {
    toJSON: {
      stats: stats,
      versionKey: false,
      depopulate: true
    },

    toObject: {
      stats: stats,
      versionKey: false,
      depopulate: true
    }
  }
};
