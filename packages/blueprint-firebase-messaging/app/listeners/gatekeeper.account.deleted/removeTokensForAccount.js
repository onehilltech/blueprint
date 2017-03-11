var winston = require ('winston')
  , CloudToken = require ('../../models/CloudToken')
  ;

function removeTokensForAccount (account) {
  var query = {owner: account.id};

  CloudToken.remove (query, function (err) {
    if (err)
      winston.log ('error', util.inspect (err));
  });
}

module.exports = exports = removeTokensForAccount;