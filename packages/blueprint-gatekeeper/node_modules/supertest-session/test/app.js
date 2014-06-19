var connect = require('connect');

var app = module.exports = connect();

app.use(connect.cookieParser());
app.use(connect.cookieSession({ secret: 'not-very' }));

app.use(function (req, res) {

  if (!req.session.count) {
    req.session.count = 1;
  }
  else {
    req.session.count++;
  }

  res.statusCode = 200;
  res.end([req.method, req.session.count].join(','));
});

