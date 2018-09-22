blueprint-greenlock
=====================

A blueprint module for Greenlock<sup>TM</sup>.

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-greenlock.svg?maxAge=2592000)](https://www.npmjs.com/package/@onehilltech/blueprint-greenlock)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-greenlock.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-greenlock)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-greenlock.svg)](https://david-dm.org/onehilltech/blueprint-greenlock)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-greenlock/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-greenlock?branch=master)

* Seamlessly integrates Blueprint application with Let's Encrypt.
* Automatically renews certificates within specified time window.
* Minimal configuration needed.
* Supports specialization of workflow entities.

Installation
--------------

    yarn add @onehilltech/blueprint-greenlock
    
or
 
    npm install @onehilltech/blueprint-greenlock --save


Getting Started
--------------------

### Server Configuration

Update the server configuration to use the Greenlock<sup>TM</sup> protocol.

```javascript
// app/configs/server.js

module.exports = {
  connections : {
    greenlock : { protocol: 'greenlock' },
  }
};
```

## Basic Configuration

Create the Greenlock<sup>TM</sup> configuration file.

```javascript
// app/configs/greenlock.js

module.exports = {
  /// Your list of domains supported by application.
  domains: ['greenlock.onehilltech.com'],
  
  /// Your contact email address.
  email: 'contact@onehilltech.com',
  
  /// Use basic strategy for approving domains.
  approveDomains: 'basic'
};
```

## Custom Approvals

The [basic configuration](#basic-configuration) works well when you have one or
more domains that all have the same configuration and approval. If you are in a 
situation where different domains have different configurations and/or approvals
then you need to implement a custom configuration.

```javascript
// app/greenlock/approve-domains.js

const { ApproveDomains } = require ('@onehilltech/blueprint-greenlock');

/**
 * A custom implementation for approving domains. 
 */
module.exports = ApproveDomains.extend ({
  approveDomains (options, certs) {
    // maybe lookup options.domain in a database.
  } 
});
```

> The custom configuration must be located in `app/greenlock/approve-domains`. Otherwise
> the module will not be able to locate it.

The custom domain approval class must implement `approveDomains`. This method must 
return `{ options, certs }`, or a `Promise` that resolves `{ options, certs }`. If
the domain is not approved, then this method must return `Promise.reject (new Error (...))`.

Next, update the greenlock configuration to use custom domain approvals.

```javascript
// app/configs/greenlock.js

module.exports = {
  /// Use custom strategy for approving domains.
  approveDomains: 'custom'
};
```

Happy Coding!
