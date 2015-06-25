# passport-oauth2-client-password

OAuth 2.0 client password authentication strategy for [Passport](https://github.com/jaredhanson/passport).

This module lets you authenticate requests containing client credentials in the
request body, as [defined](http://tools.ietf.org/html/draft-ietf-oauth-v2-27#section-2.3.1)
by the OAuth 2.0 specification.  These credentials are typically used protect
the token endpoint and used as an alternative to HTTP Basic authentication.

## Install

    $ npm install passport-oauth2-client-password

## Usage

#### Configure Strategy

The OAuth 2.0 client password authentication strategy authenticates clients
using a client ID and client secret.  The strategy requires a `verify` callback,
which accepts those credentials and calls `done` providing a client.

    passport.use(new ClientPasswordStrategy(
      function(clientId, clientSecret, done) {
        Clients.findOne({ clientId: clientId }, function (err, client) {
          if (err) { return done(err); }
          if (!client) { return done(null, false); }
          if (client.clientSecret != clientSecret) { return done(null, false); }
          return done(null, client);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'oauth2-client-password'`
strategy, to authenticate requests.  This strategy is typically used in
combination with HTTP Basic authentication (as provided by [passport-http](https://github.com/jaredhanson/passport-http)),
allowing clients to include credentials in the request body.

For example, as route middleware in an [Express](http://expressjs.com/)
application, using [OAuth2orize](https://github.com/jaredhanson/oauth2orize)
middleware to implement the token endpoint:

    app.get('/profile', 
      passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
      oauth2orize.token());

## Examples

The [example](https://github.com/jaredhanson/oauth2orize/tree/master/examples/express2)
included with [OAuth2orize](https://github.com/jaredhanson/oauth2orize)
demonstrates how to implement a complete OAuth 2.0 authorization server.
`ClientPasswordStrategy` is used to authenticate clients as they request access
tokens from the token endpoint.

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/jaredhanson/passport-oauth2-client-password.png)](http://travis-ci.org/jaredhanson/passport-oauth2-client-password)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2012-2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>
