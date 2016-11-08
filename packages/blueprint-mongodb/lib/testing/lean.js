'use strict';

module.exports = lean;

function lean (doc) {
  return JSON.parse (JSON.stringify (doc));
}
