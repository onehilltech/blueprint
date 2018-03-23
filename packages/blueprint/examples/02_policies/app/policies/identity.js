const {
  Policy
} = require ('@onehilltech/blueprint');

module.exports = function (value) {
  return new Policy ({
    name: 'identity',
    failureCode: 'failure',
    failureMessage: 'The identify through policy has failed.',

    runCheck () {
      return value;
    }
  })
};
