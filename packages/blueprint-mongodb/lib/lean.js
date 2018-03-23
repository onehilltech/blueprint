const {
  parse,
  stringify
} = JSON;

module.exports = function lean (value) {
  return parse (stringify (value));
};
