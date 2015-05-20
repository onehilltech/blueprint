function getRandomInt (min, max) {
  return Math.floor (Math.random () * (max - min + 1)) + min;
}

exports.generateToken = function (len) {
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push (chars[getRandomInt (0, charlen - 1)]);
  }

  return buf.join ('');
}
