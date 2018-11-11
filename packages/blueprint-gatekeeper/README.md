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

Define the configuration file to configure the module for your application:

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

### Mount Gatekeeper router endpoint

Define a route (or router) to import the Gatekeeper routes into the application:

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

### Protecting routes

The router definition above will expose the Gatekeeper routers at `/gatekeeper`.
Lastly, define the routes you want to protect using the ```gatekeeper.auth.bearer```
Blueprint policy. For example, you can protect all routes on a given path:

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

The router above will protect all routes under the `/v1` path, which includes all routers located
in `app/routers/v1` directory. The client will need to define the `Authorization` header and include 
a generated token.

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

### Initial setup (for production only)

Run the setup script from the project directory:

    ./bin/gatekeeper-setup
    
This will register the [gatekeeper-cli](https://github.com/onehilltech/gatekeeper-cli) 
client, and other clients, with the server. The client registrations will be placed in 
`.gatekeeper` under the project directory.

Next Steps
-----------

See the [Wiki](https://github.com/onehilltech/blueprint-gatekeeper/wiki) for 
more information.
