const Policy = require ('../../../../lib/policy');

module.exports = function (value) {
  return new Policy ({
    runCheck () {
      return value;
    }
  });
};
