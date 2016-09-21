var createClients = require ('./create')
  ;

function createTimes (num) {
  return function (client, callback) {
    return createClients (num, client, callback);
  };
}

module.exports = exports = createTimes;
