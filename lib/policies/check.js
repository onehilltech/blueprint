const Check = require ('./-check');
const negate = require ('./-negate');

/**
 * The check policy builder will lookup an existing policy by name. The first
 * parameter to the check() method is the name of the policy. All remaining parameters
 * are passed to the policy factory method. If the policy is not found, then an
 * exception is thrown.
 *
 * If the name of the policy starts with a question mark (?), then the policy
 * is considered optional.
 *
 * @returns {*}
 */
module.exports = function () {
  const [name, ...params] = arguments;
  const optional = name[0] === '?';
  const not = name[0] === '!';
  const policyName = (optional || not) ? name.slice (1) : name;

  let check = new Check ({ name: policyName, params, optional });

  if (not)
    check = negate (check);

  return check;
};