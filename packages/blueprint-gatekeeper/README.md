An authentication client and module for Express.js _application programming 
interfaces (APIs)_. Mayipass implements the OAuth 2.0 protocol atop of MongoDB, 
and is designed to be deployed with any services that wants to expose an API 
for clients to remotely communicate with their service over the Internet.

OAuth 2.0 Resource Protection
==============================

You can configure OAuth 2.0 to protect individual resources as follows:

```
// Load passport and mayipass modules.
var passport = require ('passport'),
    mayipass = require ('mayipass');

// Install the bearar authentication strategy.
passport.use (mayipass.auth.bearer ());

// Create a protected resource using Express
app.get ('/protected/resource/uri', [
  passport.authenticate ('bearer', {session: false}),
  function (req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`. It is typically used to indicate scope of the token,
    // and used in access control checks. For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json ({ id: req.user._id, name: req.user.email, scope: req.authInfo.scope })
  }
]);
```

This is good if you do not need to protect a large number of resources, or
individual resources are not located under the same base URI.

If you need to protect a set of resources that have the same base URI, then
you can use the following method to enable OAuth 2.0 protection:


```
// Load passport and mayipass modules.
var passport = require ('passport'),
    mayipass = require ('mayipass');

// Install the bearar authentication strategy.
passport.use (mayipass.auth.bearer ());

// Create a protected resource using Express
app.use ('/baseuri', passport.authenticate ('bearer', {session: false}));
app.get ('/baseuri/protected/resource', function (req, res) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`. It is typically used to indicate scope of the token,
    // and used in access control checks. For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json ({ id: req.user._id, name: req.user.email, scope: req.authInfo.scope })
});
```
