blueprint-mongodb
=================

A Blueprint.js module for MongoDB

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-mongodb.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-mongodb)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-mongodb.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-mongodb)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-mongodb.svg)](https://david-dm.org/onehilltech/blueprint-mongodb)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-mongodb/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-mongodb?branch=master)


Installation
------------

Run the `blueprint` program for your Blueprint.js application root directory.

    blueprint module install @onehilltech/blueprint-mongodb

Usage
-----

### Configuration

Define the `mongodb.config.js` configuration file in your Blueprint.js application.

```javascript
// mongodb.config.js

module.exports = {
  defaultConnection: // Optional name of default connection [default is $default]
  
  connections: {     // Define one or more connections by name.    
    $default: {
      connstr:       // MongoDB connection string
      options:  {    // mongoose connection options
            
      }      
    }
  }
};
```

### Models


### ResourceController

The `ResourceController` is a default implementation of a resource controller
designed to integrate with the Blueprint.js architecture. The `ResourceController`
can be used as-is, or extended to add domain-specific customizations.

```javascript
var blueprint = require ('@onehilltech/blueprint')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , ResourceController = mongodb.ResourceController
  , Person = require ('../models/Person')
  ;
    
function PersonController () {
  ResourceController.call (this, {name: person, model: Person});
}

blueprint.controller (PersonController, ResourceController)

```

### GridFSController
