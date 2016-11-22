gatekeeper-cli
==============

command-line interface for Gatekeeper

[![npm version](https://img.shields.io/npm/v/@onehilltech/gatekeeper-cli.svg?maxAge=2592000)](https://www.npmjs.com/package/@onehilltech/gatekeeper-cli)
[![Build Status](https://travis-ci.org/onehilltech/gatekeeper-cli.svg?branch=master)](https://travis-ci.org/onehilltech/gatekeeper-cli)
[![Dependencies](https://david-dm.org/onehilltech/gatekeeper-cli.svg)](https://david-dm.org/onehilltech/gatekeeper-cli)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/gatekeeper-cli/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/gatekeeper-cli?branch=master)

Installation
--------------

    blueprint module install @onehilltech/gatekeeper-cli
 
Getting Started
----------------

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

Define a route (or router) to import the Gatekeeper routes into the application:

```javascript
// app/routers/GatekeeperRouter.js
var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  '/gatekeeper': [ blueprint.ModuleRouter ('@onehilltech/gatekeeper:v1') ]
};
```

The router definition above will expose the Gatekeeper routers at `/gatekeeper`.
Lastly, define the routes you want to protect. For example, you can protect all
routes on a give path.

```javascript
// app/routers/IndexRouter.js

var passport = require ('passport')
  ;

exports = module.exports = {
  '/v1': [
    passport.authenticate ('bearer', {session: false})
  ]
};
```

The router above will protect all routes under the `/v1` path, which
includes all routers located in `app/routers/v1` directory. The client will
need to define the `Authorization` header and include a generated token.
Otherwise, the protected routes will return `401`.

For more details on allowed routes, see `app/routers` for Gatekeeper.

Happy Coding!
