module.exports = exports = {};

const { fromKey, fromKeyFile } = require ('./key');
const { fromSeed, fromSeedFile } = require ('./seed');

exports.fromKey = fromKey;
exports.fromKeyFile = fromKeyFile;
exports.fromSeed = fromSeed;
exports.fromSeedFile = fromSeedFile;
