blueprint-socket.io
===================

A Blueprint.js module for Socket.IO

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-socket.io.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-socket.io)
[![Build Status](https://travis-ci.org/onehilltech/blueprint-socket.io.svg?branch=master)](https://travis-ci.org/onehilltech/blueprint-socket.io)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-socket.io.svg)](https://david-dm.org/onehilltech/blueprint-socket.io)
[![Coverage Status](https://coveralls.io/repos/github/onehilltech/blueprint-socket.io/badge.svg?branch=master)](https://coveralls.io/github/onehilltech/blueprint-socket.io?branch=master)


Installation
------------

    npm install @onehilltech/blueprint-socket.io --save


Usage 
-----

Socket.IO is integrated within a Blueprint controller. First, we need to import the
the module:

```javascript
var SocketIO = require ('@onehilltech/blueprint-socket.io');
```

In the target controller method, we need to listen for the connection. For example,
assume we are creating a [chat](http://socket.io/get-started/chat/) client using a 
single-action `ChatController`. In the controller method (i.e., `__invoke`), we 
need to listen the application initialized event. While handling the application
initialized event, we need to listen for the Socket.IO connection event. The connection
event will return us a socket we can use to send/receive events.
 
```javascript
ChatController.prototype.__invoke = function (context) {
  blueprint.messaging.on ('app.init', function (app) {
    // We are using the http:// server. If we are using the https:// server,
    // the we use SocketIO.ios.
 
    SocketIO.io.on ('connection', function (socket) {
      console.log ('a user connected');

      socket.on ('disconnect', function(){
        console.log ('user disconnected');
      });

      socket.on ('chat message', function(msg){
        console.log('message: ' + msg);

        SocketIO.io.emit ('chat message', msg);
      });
    });  
  });

  return function (req, res) {
    res.status (200).render ('chat.handlebars');
  }
});
```

### Namespaces

Socket.IO provides a concept called [namespaces](http://socket.io/docs/rooms-and-namespaces/#namespaces), 
which allows you to partition resources based on a path. The example above
uses the default namespace of `/`. You can use custom namespaces with the
[blueprint-socket.io](https://github.com/onehilltech/blueprint-socket.io) module.
The namespace in Socket.IO will correspond with the router path binding to the
controller method. You can retrieve the router path from the parameter passed
to the controller method. Below is an example of using custom namespaces
in [blueprint-socket.io](https://github.com/onehilltech/blueprint-socket.io).

```javascript
NewController.prototype.streamNews = function (context) {
  blueprint.messaging.on ('app.init', function (app) {
    // Create a custom namespace based on the binding path.
    var nsp = SocketIO.io.of (context.path);
    
    nsp.on ('connection', function (socket) {
      console.log ('a user connected');

      nsp.on ('disconnect', function(){
        console.log ('user disconnected');
      });
      
      nsp.on ('chat message', function(msg){
        console.log('message: ' + msg);
        nsp.emit ('chat message', msg);
      });
    });  
  });

  return function (req, res) {
    res.status (200).render ('news.handlebars');
  }
});
```

Happy Coding!
