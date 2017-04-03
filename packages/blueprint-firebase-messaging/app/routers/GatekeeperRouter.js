'use strict';

var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  '/gatekeeper': blueprint ('router://@onehilltech/gatekeeper:v1')
};
