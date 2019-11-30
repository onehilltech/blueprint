Gatekeeper
=============

OAuth 2.0 token server and module for Blueprint.js

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-gatekeeper.svg?maxAge=2592000)](https://www.npmjs.com/package/@onehilltech/blueprint-gatekeeper)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-gatekeeper.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-gatekeeper)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-gatekeeper.svg)](https://david-dm.org/onehilltech/blueprint-gatekeeper)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-gatekeeper/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-gatekeeper?branch=master)

* Stand-alone token-based authentication server
* Module support for [Blueprint.js](https://github.com/onehilltech/blueprint) integration
* Implements the [OAuth 2.0](http://oauth.net/2/) specification
* Uses [JSON Web Tokens (JWTs)](https://jwt.io/) to generate tokens
* Stores tokens into [MongoDB](https://www.mongodb.org/) database

Installation
--------------

    yarn add @onehilltech/blueprint-gatekeeper
    
or
 
    npm install @onehilltech/blueprint-gatekeeper --save

Getting Started
----------------

### Defining the configuration

Gatekeeper uses [JSON Web Tokens](https://jwt.io/) to manage authorization of authenticated 
users. To get started, you must first configure the options for token generation. The options
supported are the same as those in [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).

```javascript
// app/configs/gatekeeper.js

module.exports = {
 tokens: {
     // This is the base options for all token generators.
     $: {
       issuer: '[your-issuer-name-here]',
       expiresIn: '1h',
       algorithm: 'HS256',
       secret: 'ssshhh'
     }
 },
};
```

> The `jwtid` option is not supported since Gatekeeper uses it to generate a 
> unique id for each token.

### Mount Gatekeeper router endpoint

Next, we need to import (or mount) the Gatekeeper router into our application. This
will expose routes for managing and authenticating accounts and clients.

```javascript
// app/routers/endpoint.js

const blueprint = require ('@onehilltech/blueprint');
const { Router } = blueprint;

module.exports = Router.extend ({
  specification: {
    '/gatekeeper': blueprint.mount ('@onehilltech/blueprint-gatekeeper:v1')    
  }
});
```

In the example above, we are mounting the `v1` router to the `/gatekeeper` endpoint.
This means that all [routers](https://github.com/onehilltech/blueprint-gatekeeper/tree/master/app/routers/v1) 
in `v1` will be accessible at `http://[hostname]/gatekeeper/`.

### Protecting routes

The last step is to define what routes require authorization (_i.e._, are protected)
using the `gatekeeper.auth.bearer` Blueprint policy. 

```javascript
// app/routers/endpoint.js

const blueprint = require ('@onehilltech/blueprint');
const { Router } = blueprint;

module.exports = Router.extend ({
  specification: {
    '/gatekeeper': blueprint.mount ('@onehilltech/blueprint-gatekeeper:v1'),
    
    // Let's protect the /v1 routes.
    '/v1': {
      policy: 'gatekeeper.auth.bearer'
    }  
  }
});
```

In the example above, the router will protect all routes under the `/v1` path, 
which also includes all routers located in `app/routers/v1` directory. The client 
will need to define the `Authorization` header and include a generated token.

### Accessing the Authorized User

The `req.user` property contains the account models for an authorized user making
the request to access a protected route. For example, here is an example of setting
the user making the request as the owner of a created resource.

```javascript
const { models } = require ('@onehilltech/blueprint');
const { ResourceController } = require ('@onehilltech/blueprint-mongodb');

module.exports = ResourceController.extend ({
  Model: models ('tweet'),
  
  create () {
    return this._super (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        // Make the authorized user the owner of the created resource.
        doc.user = req.user._id;
        return doc;
      }
    });
  }
});
```

> Gatekeeper has a `UserResourceController` that automatically adds the authorized
> user making the request as the owner of the resource being created.

### Cross-Origin Resource Sharing (CORS)

Cross-Origin Resource Sharing (CORS) is a mechanism that allows a client from one domain
to access resources from another domain. This typically occurs when you have a web browser
accessing an API protected by Gatekeeper. If you need to enable CORS support for your
Blueprint application, then use the `gatekeeper.cors()` middleware:

```javascript
// app/routes/v1.js

const { env } = require ('@onehilltech/blueprint');
const { cors } = require ('@onehilltech/blueprint-gatekeeper');

module.exports = {
  '/v1': {
    use: [cors ({
      origin: env !== 'production' ? true : null
    })]
  }
};
```

Now, any request for a route that begins with `/v1` will support CORS. The `gatekeeper.cors()`
middleware is a wrapper around [Express CORS](https://github.com/expressjs/cors). It will check
if the origin in the request matches any registered client only when running in production. All
other times, CORS is enabled by default regardless of the origin in the request.

Third-party Authentication
----------------------------

Third-party authentication is when you use another service to authenticate the user, and then
issues an access token for authenticated user on the host system/service. For example, you use 
Facebook to authenticate a user and then issue an access token from the host service for the 
authenticated user. The rationale for such capabilities is you want to use the host service 
authorization mechanism to control access, but do not want to require users to manage authentication 
(i.e., username and passwords) on either system.

To account for this scenario, Gatekeeper provides a `session` service that can be used to issue
access tokens for accounts/users against a client. It is the host system's responsibility to ensure
the generated access tokens are for authenticated users. To use the service, just inject the `session`
service into your controller. Then, define an `authenticate()` method to authenticate a user using the
third-party service. This means the user will submit their username and password to the host service,
and the host service will forward the information along to the third-party service.

```javascript
module.exports = Controller.extend ({
  /// Inject the session service into the controller.
  session: service (),
  
  authenticate () {
    return Action.extend ({
      execute (req, res) {
        return this.authenticateUsingThirdParty ();
          .then (result => {
            //
          });
      }
    });
  }
})
```

Once the user is authenticated, you then use information about the authenticated user to 
issue an access token. As shown in the example below, you will first use `findAccountByEmail`
or `findAccountByUsername` to lookup the corresponding account for the user.

> `findAccountByEmail` and `findAccountByUsername` does not create an account if it does
> not exist. If the account does not exist, you will have to create one.

Then use `issueToken` to issue a token for the account on the corresonding client. Lastly,
use `serializeToken` to convert the token from an object to a JSON object. The JSON object
can then be sent as a response to the client. 

```javascript
module.exports = Controller.extend ({
  /// Inject the session service into the controller.
  session: service (),
  
  authenticate () {
    return Action.extend ({
      execute (req, res) {
        const { client_id } = req.body;
        
        return this.authenticateUsingThirdParty (req)
          .then (result => this.session.findAccountByEmail (result.email))
          .then (account => this.session.issueToken (client_id, account))
          .then (token => this.session.serializeToken (token))
          .then (token => res.json (token));
      }
    });
  },
  
  authenticateUsingThirdParty () {
    // Perform the remote authentication.
  }
})
```


Gatekeeper Client Libraries
----------------------------

* [ember-cli-gatekeeper](https://github.com/onehilltech/ember-cli-gatekeeper)

Next Steps
-----------

See the [Wiki](https://github.com/onehilltech/blueprint-gatekeeper/wiki) for 
more information.
