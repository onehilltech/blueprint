An authentication server and client module for [Passport](http://passportjs.org/).
Gatekeeper implements the [OAuth 2.0](http://oauth.net/2/) protocol atop of 
[MongoDB](https://www.mongodb.org/), and is designed to be deployed with any service 
that wants to expose an WebAPI for clients via the Internet.

OAuth 2.0 Resource Protection
==============================

You can configure OAuth 2.0 to protect individual resources as follows:

```
// Load Passport and Gatekeeper modules.
var passport   = require ('passport')
  , gatekeeper = require ('gatekeeper')
  ;

// Install the bearar authentication strategy.
passport.use (gatekeeper.auth.bearer ());

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

This is good if you do not need to protect a large number of resources, or individual 
resources are not located under the same base URI. If you need to protect a set of 
resources that have the same base URI, then use the following approach:

```
// Load passport and mayipass modules.
var passport   = require ('passport')
  , gatekeeper = require ('gatekeeper')
  ;

// Install the bearar authentication strategy.
passport.use (gatekeeper.auth.bearer ());

// Protect all routes under /baseuri
app.use ('/baseuri', passport.authenticate ('bearer', {session: false}));
```
