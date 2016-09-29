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

Models represent the different collections stored in the 
[MongoDB](https://www.mongodb.com) database. The models are defined 
using [Mongoose schemas](http://mongoosejs.com/docs/guide.html).

```javascript
// app/models/Person.js

var mongodb = require ('@onehilltech/blueprint-mongodb')
  ;

// use mongodb.Types to access mongoose.Types

var schema = mongodb.Schema ({
  first_name: {type: String, required: true, trim: true},
  last_name: {type: String, required: true, trim: true}
});

module.exports = mongodb.model ('person', schema);
```

All models are defined on the default connection unless stated otherwise. To define
a model on a different connection, use the `modelOn()` function where the first parameter
is the name of the connection as defined in `mongodb.config.js`, followed by the 
same parameters for the `model()` function.

### ResourceController

The `ResourceController` is a default implementation of a resource controller
that integrates with the Blueprint.js architecture. The `ResourceController`
can be used as-is, or extended to add domain-specific customizations.

```javascript
var blueprint = require ('@onehilltech/blueprint')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , ResourceController = mongodb.ResourceController
  , Person = require ('../models/Person')
  ;
    
function PersonController () {
  ResourceController.call (this, {name: 'person', model: Person});
}

blueprint.controller (PersonController, ResourceController)

```

**Messaging Framework.** All actions on the default implementation of the
`ResourceController` will generate the following events on Blueprint.js messaging 
framework.

| Action | Event | Example |
|--------|-------|---------|
| create | [prefix.][name].created | [prefix.]person.created |
| update | [prefix.][name].updated | [prefix.]person.updated |
| delete | [prefix.][name].deleted | [prefix.]person.deleted |

The prefix in the event name is optional. It is defined by the `eventPrefix` property
passed to the `ResourceController` constructor.
 
### GridFSController


