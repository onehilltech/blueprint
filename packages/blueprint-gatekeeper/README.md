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

    npm install @onehilltech/blueprint-gatekeeper --save
    
Getting Started
----------------

### Defining the configuration

Define the configuration file `gatekeeper.config.js` to configure the module
for your application:

```javascript
module.exports = {
  token: {
    kind: 'jwt',
    options: {
      issuer: 'name-of-the-application',
      algorithm : 'RS256',
      secret: 'ssshhh'   // can replace with publicKey, privateKey properties
    }
  }
};
```

### Initial setup

Run the setup script from the project directory:

    ./bin/gatekeeper-setup
    
This will register the [gatekeeper-cli](https://github.com/onehilltech/gatekeeper-cli) 
client, and other clients, with the server. The client registrations will be placed in 
`.gatekeeper` under the project directory.

### Mount Gatekeeper router endpoint

Define a route (or router) to import the Gatekeeper routes into the application:

```javascript
// app/routers/EndpointRouter.js
const blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  '/gatekeeper': blueprint ('router://@onehilltech/blueprint-gatekeeper:v1')
};
```

### Protecting routes

The router definition above will expose the Gatekeeper routers at `/gatekeeper`.
Lastly, define the routes you want to protect using the ```gatekeeper.auth.bearer```
Blueprint policy. For example, you can protect all routes on a given path:

```javascript
// EndpointRouters.js

module.exports = {
  '/v1': {
    policy: 'gatekeeper.auth.bearer'
  }
};
```

The router above will protect all routes under the `/v1` path, which
includes all routers located in `app/routers/v1` directory. The client will
need to define the `Authorization` header and include a generated token.

Next Steps
-----------

See the [Wiki](https://github.com/onehilltech/blueprint-gatekeeper/wiki) for 
more information.
