const FirebaseDevice = require ('../../models/firebase-device');
const util = require ('util');

function removeTokensForAccount (account) {
  FirebaseDevice.remove ({user: account._id}, function (err) {
    if (err)
      console.error (util.inspect (err));
  });
}

module.exports = exports = removeTokensForAccount;