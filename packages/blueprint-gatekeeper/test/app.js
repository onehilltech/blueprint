var express      = require ('express'),
    bodyParser   = require ('body-parser'),
    mongoose     = require ('mongoose'),
    passport     = require ('passport'),
    morgan       = require ('morgan'),
    session      = require ('express-session'),
    cookieParser = require ('cookie-parser'),
    config       = require ('./app-config');

// Create the application, and set the default configuration.
var app = express ();
app.use (morgan (config.morgan.format));
app.use (bodyParser (config.bodyParser));
app.use (cookieParser (config.cookieParser));
app.use (session (config.session));

app.use (passport.initialize ());
app.use (passport.session ());

// Connect to the database.
console.log ('database connection is ' + config.connstr);
mongoose.connect (config.connstr, config.mongodb);

// Export symbols from the module.
module.exports = exports = app;
exports.config = config;

