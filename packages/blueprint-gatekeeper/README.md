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

The `req.user` property contains the account model for an authorized user making
the request to access a protected route. For example, here is an example of setting
the user making the request as the owner of a created resource.

```javascript
const { model } = require ('@onehilltech/blueprint');
const { ResourceController } = require ('@onehilltech/blueprint-mongodb');

module.exports = ResourceController.extend ({
  Model: model ('tweet'),
  
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

const { cors } = require ('@onehilltech/blueprint-gatekeeper');

module.exports = {
  '/v1': {
    use: [cors ()]
  }
};
```

Now, any request for a route that begins with `/v1` will support CORS. The `gatekeeper.cors()`
middleware is a wrapper around [Express CORS](https://github.com/expressjs/cors). It will check
if the origin in the request matches any registered client.

Gatekeeper Client Libraries
----------------------------

* [ember-cli-gatekeeper](https://github.com/onehilltech/ember-cli-gatekeeper)

Next Steps
-----------

See the [Wiki](https://github.com/onehilltech/blueprint-gatekeeper/wiki) for 
more information.
