blueprint-socket.io
===================

A Blueprint.js module for Socket.IO

[![npm version](https://img.shields.io/npm/v/@onehilltech/blueprint-socket.io.svg)](https://www.npmjs.com/package/@onehilltech/blueprint-socket.io)
[![Dependencies](https://david-dm.org/onehilltech/blueprint-socket.io.svg)](https://david-dm.org/onehilltech/blueprint-socket.io)

Features
------------

* Create Socket.IO servers on all (or selective) server connections
* Bind connections and namespaces to computed properties for easier access
* Uses Blueprint listeners to handle connection events

Installation
------------

    yarn add @onehilltech/blueprint-socket.io
    
or 

    npm install @onehilltech/blueprint-socket.io --save

Listening for Connections
-----------------------------

The server listens for Socket.IO connections by extending the `ConnectionListener` 
class provided by this module, and registering the listener for the `socket.io.connection` 
event. The `ConnectionListener` has two methods you can override:

* `connection(name, socket)` - This method is invoked when a new client connects to the server.
* `disconnect(name, socket)` - This method is invoked when a client disconnects from the server.

For both methods, the `name` argument is the name of the connection (from `app/configs/server.js`);
and the `socket` argument is the client that connected to the server.

```javascript
// app/listeners/socket.io.connection/logger.js

const { ConnectionListener } = require ('@onehilltech/blueprint-socket.io');

module.exports = ConnectionListener.extend ({
  connection (name, socket) {
    console.log (`socket.io connection on ${name}: ${socket.id}`);
  },
  
  disconnect (name, socket) {
    console.log (`socket.io disconnect on ${name}: ${socket.id}`);
  }
});
```

### Filtering Connections

The `connections` property on the `ConnectionListener` is used to filter which connections the
listener will react.

```javascript
// app/listeners/socket.io.connection/logger.js

const { ConnectionListener } = require ('@onehilltech/blueprint-socket.io');

module.exports = ConnectionListener.extend ({
  connections: ['insecure'],
  
  connection (name, socket) {
    console.log (`socket.io connection on ${name}: ${socket.id}`);
  },
  
  disconnect (name, socket) {
    console.log (`socket.io disconnect on ${name}: ${socket.id}`);
  }
});
```

Emitting Events
----------------

The easiest way to emit an event is to bind the connection/namespace to a property
on a Blueprint component (e.g., controller, server, etc.) using the `io` factory
method. You can then use the computed property to emit an event.

> You can also use the computed property to emit to a room.

```javascript
const { Action, Controller } = require ('@onehilltech/blueprint');
const { io } = require ('@onehilltech/blueprint-socket.io');

module.exports = Controller.extend ({
  /// Bound to the insecure Socket.IO connection.
  insecure: io (),

  /**
   * Force emit a message to all participants.
   */
  emit () {
    return Action.extend ({
      execute (req, res) {
        const { message } = req.query;

        // Emit an event to all clients on the connection.
        this.controller.insecure.emit ('chat message', message);

        res.status (200).json (true);
      }
    })
  }
});
```

As shown in the example above, the `insecure` attribute is bound to the default namespace 
on the `insecure` connection. We can the emit the event on the socket.

### Emitting to a namespace

To emit to a namespace, you bind the property to a namespace using `io ().of (nsp)`. For 
example, `io ().of ('/chat')` will bind the property to the `/chat` namespace.
 
Happy Coding!
