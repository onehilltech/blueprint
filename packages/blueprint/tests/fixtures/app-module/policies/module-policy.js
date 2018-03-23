const Policy = require ('../../../../lib/policy');

module.exports = Policy.extend ({
  runCheck () {
    return true;
  }
});
