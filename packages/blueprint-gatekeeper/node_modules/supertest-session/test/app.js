var connect = require('connect'),
    cookieSession = require('cookie-session');

var app = module.exports = connect();

app.use(cookieSession({
  name: 'supertest-session',
  secret: 'not-very',
  maxAge: 3600
}));

var _sessions = {};

function counter (req, res) {
  var token;
  var _session = {};

  var _count = req.session.count || 0;

  if (req.headers.authorization) {
    token = req.headers.authorization.split(' ').pop();
    _session = _sessions[token] || { count: _count, type: 'token' };
    _sessions[token] = _session;
  }

  _session.count = _count + 1;

  req.session = _session;

  res.statusCode = 200;

  if (req.url === '/env') {
    res.end(JSON.stringify(process.env));
  }
  else {
    res.end([req.method, req.session.type, req.session.count].join(','));
  }
}

app.use(counter);

