'use strict';

function lean (value) {
  return JSON.parse (JSON.stringify (value));
}

module.exports = lean;
