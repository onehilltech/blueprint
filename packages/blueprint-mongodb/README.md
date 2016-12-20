blueprint-mongodb
=================

A Blueprint.js module for MongoDB

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-mongodb.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-mongodb)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-mongodb.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-mongodb)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-mongodb.svg)](https://david-dm.org/onehilltech/blueprint-mongodb)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-mongodb/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-mongodb?branch=master)


Installation
------------

    npm install @onehilltech/blueprint-mongodb --save

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

module.exports = mongodb.model ('person', schema, 'blueprint_people');
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
var blueprint          = require ('@onehilltech/blueprint')
  , mongodb            = require ('@onehilltech/blueprint-mongodb')
  , ResourceController = mongodb.ResourceController
  , Person             = require ('../models/Person')
  ;
    
function PersonController () {
  ResourceController.call (this, {name: 'person', model: Person});
}

blueprint.controller (PersonController, ResourceController)
```

The resource controller exposes the following actions:

| Action       | HTTP method | Path            | Body                       | Response
|--------------|-------------|-----------------|----------------------------|-----------------------------------|
| create       | POST        | /resource       | {\<resource\>: { values }} | {\<resource\>: { values }}        |
| retrieve one | GET         | /resource/:rcId | N/A                        | {\<resource\>: { values }}        |
| retrieve all | GET         | /resource       | N/A                        | {\<plural-resource\>: { values }} |   
| count        | GET         | /resource/count | N/A                        | {count: n}                        |   
| update       | UPDATE      | /resource/:rcId | {\<resource\>: { values }} | {\<resource\>: { values }}        |
| delete       | DELETE      | /resource/:rcId | N/A                        | `true` or `false`                 |

For example, the `PersonController` exposes the following actions:

| Action       | HTTP method | Path | Body                       | Response
|--------------|-------------|------| ----------------------------|-----------------------------------|
| create | POST | /person | `{person: { first_name: 'James', last_name: 'Hill }}` | `{person: {_id: 'id', first_name: 'James', last_name: 'Hill' }}` |
| retrieve one | GET | /person/id | N/A  | `{person: {_id: 'id', first_name: 'James', last_name: 'Hill' }}`  |
| retrieve all | GET | /person | N/A  | `{persons: [{_id: 'id', first_name: 'James', last_name: 'Hill' }]}` |   
| count   | GET   | /person/count | N/A                        | {count: n} |   
| update  | UPDATE | /person/id | `{person: { first_name: 'John' }}` | `{person: {_id: 'id', first_name: 'John', last_name: 'Hill }}`        |
| delete       | DELETE    | /person/id   | N/A                        | `true` or `false`                 |


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

The `GridFSController` is a [Blueprint.js](https://github.com/onehilltech/blueprint) 
resource controller designed for [GridFS](https://docs.mongodb.com/manual/core/gridfs/) 
in [MongoDB](https://www.mongodb.com). The `GridFSController` support the following
operations out-of-the-box: create, get, and delete. Currently, it does not
support getting multiple resources and updating an existing resource. 

Because `GridFS` is designed to store large files, the `GridFSController` assumes the 
client is uploading a file, which can be a multi-part file. The controller handles this 
concern automatically. It's just your responsibility to inform the controller of the 
parameter used for the upload, and what connection on the database to use for GridFS. 
Below is an example `GridFSController` for storing images that use the default connection.

```javascript
'use strict';

var blueprint        = require ('@onehilltech/blueprint')
  , mongodb          = require ('@onehilltech/blueprint-mongodb')
  , GridFSController = mongodb.GridFSController
  ;

function ImageController () {
  GridFSController.call (this, mongodb.getConnectionManager ().defaultConnection, {name: 'image'});
}

blueprint.controller (ImageController, GridFSController);

module.exports = ImageController;
```

This controller will extract the uploaded file from the `image` parameter.
In addition, it will create collections named `image.files` and `image.chunks`
in the database associated with the connection. If you want to use a different 
connection, then use the `getConnection(name)` method on the `ConnectionManager`.
