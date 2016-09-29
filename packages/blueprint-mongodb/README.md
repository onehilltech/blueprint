blueprint-mongodb
=================

A Blueprint.js module for MongoDB

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-mongodb.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-mongodb)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-mongodb.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-mongodb)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-mongodb.svg)](https://david-dm.org/onehilltech/blueprint-mongodb)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-mongodb/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-mongodb?branch=master)


Installation
------------

    blueprint module install @onehilltech/blueprint-mongodb

Usage
-----

### Configuration

Define the `mongodb.config.js` configuration file in your Blueprint.js application.

```javascript
// mongodb.config.js

module.exports = {
  // defaultConnection: name of default connection [default is $default]
  
  connections: {
    $default: {
      connstr: // MongoDB connection string
      options: // mongoose connection options
    }
  }
};
```

### ResourceController

### GridFSController
