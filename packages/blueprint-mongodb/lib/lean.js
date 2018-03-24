const {
  parse,
  stringify
} = JSON;

/**
 * This method will convert Mongoose documents to raw JavaScript objects.
 *
 * @param value
 */
module.exports = function lean (value) {
  return parse (stringify (value));
};
