blueprint-mongodb
=================

A Blueprint.js module for MongoDB

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-mongodb.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-mongodb)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-mongodb.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-mongodb)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-mongodb.svg)](https://david-dm.org/onehilltech/blueprint-mongodb)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-mongodb/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-mongodb?branch=master)


Installation
=============

    npm install @onehilltech/blueprint-mongodb --save

Usage
========

## Configuration

Define the `mongodb.js` configuration file in your Blueprint.js application.

```javascript
// app/configs/mongodb.js

module.exports = {
  connections: {
    $default: {
      uri: 'mongodb://localhost/tutorial',
      seed: [true|false],    // seed the database connection [default=false]
      options : {            // mongoose connection options
        
      }
    },
    
    connection2: {
      // ...
    }
  }
};
```

## Models

Models represent the different collections stored in the [MongoDB](https://www.mongodb.com) 
database. The models are defined using [Mongoose schemas](http://mongoosejs.com/docs/guide.html).

```javascript
// app/models/Person.js
const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;

// use mongodb.Types to access mongoose.Types

const schema = mongodb.Schema ({
  first_name: {type: String, required: true, trim: true},
  last_name : {type: String, required: true, trim: true}
});

module.exports = mongodb.models ('person', schema, 'blueprint_people');
```

All models are defined on the default connection unless stated otherwise. To define
a models on a different connection, use the `modelOn()` function where the first parameter
is the name of the connection as defined in `mongodb.js` followed by the same parameters for 
the `models()` function.

## Resources

### Resource Model

A resource models is a models that includes an extra `_stats` property that details when the
resource is created and updated. Both fields are managed automatically. You define a resource
models similar to how you define a regular models. Instead of using the `models()` function, you
use the `resource()` function. 

```javascript
// app/models/Person.js
const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;

// use mongodb.Types to access mongoose.Types

const schema = mongodb.Schema ({
  first_name: {type: String, required: true, trim: true},
  last_name : {type: String, required: true, trim: true}
});

module.exports = mongodb.resource ('person', schema, 'blueprint_people');
```

### Soft Deletes

A soft delete is when the models is marked as deleted, but remains in the database. This is 
important if you want to still access the models in references. Soft delete is only available
on resource models.

You add soft delete to a resource by setting the `softDelete` option to `true` when you are
creating the schema.

```javascript
const schema = mongodb.Schema ({
  first_name: {type: String, required: true, trim: true},
  last_name : {type: String, required: true, trim: true}
}, {softDelete: true});

module.exports = mongodb.resource ('person', schema, 'blueprint_people');
```

Now, when the `person` resource models is created, the `_stat` property will contain a 
`deleted_at` property. This property will be managed internally by the resource controller.

### Resource Controller

The `ResourceController` is a default implementation of a resource controller that integrates 
with the Blueprint.js architecture. The 
[`ResourceController`](https://blueprint.onehilltech.com/developer-guide/routers-and-controllers/resources) 
can be used as-is, or extended to add domain-specific customizations.

```javascript
const { ResourceController } = require ('@onehilltech/blueprint-mongodb');
const { models } = require ('@onehilltech/blueprint');

/**
 * @class PersonController 
 * 
 * Resource controller for the person resource models.
 */
module.exports = ResourceController.extend ({
  models: models ('person')
});
```

The resource controller exposes the following actions:

| Action       | HTTP method | Path            | Body                       | Response
|--------------|-------------|-----------------|----------------------------|-----------------------------------|
| create       | POST        | /resource       | {\<resource\>: { values }} | {\<resource\>: { values }}        |
| getOne       | GET         | /resource/:rcId | N/A                        | {\<resource\>: { values }}        |
| getAll       | GET         | /resource       | N/A                        | {\<plural-resource\>: { values }} |   
| count        | GET         | /resource/count | N/A                        | {count: n}                        |   
| update       | PUT         | /resource/:rcId | {\<resource\>: { values }} | {\<resource\>: { values }}        |
| delete       | DELETE      | /resource/:rcId | N/A                        | `true` or `false`                 |

For example, the `PersonController` exposes the following actions:

| Action  | HTTP method | Path          | Body                        | Response
|---------|-------------|---------------| ----------------------------|-----------------------------------|
| create  | POST        | /person       | `{person: { first_name: 'James', last_name: 'Hill }}` | `{person: {_id: 'id', first_name: 'James', last_name: 'Hill' }}` |
| getOne  | GET         | /person/id    | N/A                         | `{person: {_id: 'id', first_name: 'James', last_name: 'Hill' }}`  |
| getAll  | GET         | /person       | N/A  | `{persons: [{_id: 'id', first_name: 'James', last_name: 'Hill' }]}` |   
| count   | GET         | /person/count | N/A                         | {count: n} |   
| update  | PUT         | /person/id    | `{person: { first_name: 'John' }}` | `{person: {_id: 'id', first_name: 'John', last_name: 'Hill }}`        |
| delete  | DELETE      | /person/id    | N/A                         | `true` or `false`                 |

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

### Adding Domain-specific Behavior

Each method in the `ResourceController` returns an action that can be extended to add
domain-specific behavior. For example, you may want to do pre and post processing before
and after the models is created, respectively. It is as simple as extending the action
in your subclass of the `ResourceController`, and overloading the appropriate methods.

```javascript
const { ResourceController } = require ('@onehilltech/blueprint-mongodb');
const { models } = require ('@onehilltech/blueprint');

/**
 * @class PersonController 
 * 
 * Resource controller for the person resource models.
 */
module.exports = ResourceController.extend ({
  models: models ('person'),
  
  create () {
    return this._super.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        doc.user = req.user._id;
        return doc;
      }
    });
  }
});
```

The following is a list of the actions, and the method that can be overloaded in
their order of execution.

* **`create`**
  * **prepareDocument (req, doc)**
  * **preCreateModel (req)**
  * **createModel (req, doc)**
  * **postCreateModel (req, models)**
  * **prepareResponse (req, res, result)**
  
* **`getOne`**
  * **getId (req, id)**
  * **getProjection(req)**
  * **getOptions (req, options)**
  * **preGetModel (req)**
  * **getModel (req, id, projection, options)**
  * **postGetModel (req, models)**
  * **prepareResponse (req, res, result)**
  
* **`getAll`**
  * **getFilter (req, query)**
  * **getProjection (req)**
  * **getOptions (req, options)**
  * **preGetModels (req)**
  * **getModels (req, filter, projection, options)**
  * **postGetModels (req, models)**
  * **.prepareResponse (req, res, result)**
  
* **`update`**
  * **getId (req, id)**
  * **getUpdate (req, update)**
  * **getOptions (req, options)**
  * **preUpdateModel (req)**
  * **updateModel (req, id, update, options)**
  * **postUpdateModel (req, models)**
  * **prepareResponse (req, res, result)**
  
* **`delete`**
  * **getId (req, id)**
  * **preDeleteModel (req)**
  * **deleteModel (req, id)**
  * **postDeleteModel (req, models)**
  * **prepareResponse (req, res, models, result)**
  
* **`count`**
  * **getFilter (req, filter)**
  * **preCountModels (req)**
  * **getCount (req, filter)**
  * **postCountModels (req, count)**
  * **prepareResponse (req, res, result)**

You can return a `Promise` the overloaded method if you need to perform
asynchronous execution.

## GridFSController

The `GridFSController` is a [Blueprint.js](https://github.com/onehilltech/blueprint) 
resource controller designed for [GridFS](https://docs.mongodb.com/manual/core/gridfs/) 
in [MongoDB](https://www.mongodb.com). The `GridFSController` supports the following
operations out-of-the-box: 

* `create`
* `getOne`
* `delete` 

Currently, it does not
support getting multiple resources and updating an existing resource. 

Because `GridFS` is designed to store large files, the `GridFSController` assumes the 
client is uploading a file, which can be a multi-part file. The controller handles this 
concern automatically. It's just your responsibility to inform the controller of the 
parameter used for the upload, and what connection on the database to use for GridFS. 
Below is an example `GridFSController` for storing images that use the default connection.

```javascript
const { GridFSController } = require ('@onehilltech/blueprint-mongodb');

/**
 * @class ImageController
 */
module.exports = GridFSController.extend ({
  // name of resource
  name: 'image',       
});
```

This controller will extract the uploaded file from the `image` parameter.
In addition, it will create collections named `image.files` and `image.chunks`
in the database associated with the connection. 

See [`GridFSController`](https://github.com/onehilltech/blueprint-mongodb/blob/master/lib/gridfs-controller.js) 
for the optional properties to configure the controller's behavior.

