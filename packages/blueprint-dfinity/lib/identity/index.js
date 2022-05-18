module.exports = exports = {};

const { fromKey, fromKeyFile } = require ('./key');

exports.fromKey = fromKey;
exports.fromKeyFile = fromKeyFile;

exports.fromSeed = require ('./seed');