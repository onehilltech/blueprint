const {
  Policy
} = require ('@onehilltech/blueprint');

module.exports = Policy.extend ({
  failureCode: 'failure',
  failureMessage: 'The pass through policy has failed.',

  runCheck (req, value) {
    return value;
  }
});
