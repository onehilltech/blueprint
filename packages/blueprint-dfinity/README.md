blueprint-dfinity
================================

A Blueprint.js module for interface with the Internet Computer from NodeJS


Installation
=============

    npm install @onehilltech/blueprint-dfinity --save


Usage
========

## Defining the actor(s)

First, define the IDL for the Internet Computer actor that you want to invoke from
the Blueprint.js application. Each actor is defined in its own file in `app/actors`.
Here is `hello` actor from the [Hello World](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins/) actor:
getting started example.

```javascript
// app/actors/hello.js

const { update, query, Actor } = require ('@onehilltech/blueprint-dfinity');

/**
 * @class HelloActor
 * 
 */
module.exports = Actor.extend ({
  /// Define the greet update method.
  greet: update ('text', 'text')
});

```

## Using the actor in Blueprint.js components

After you define your actors, you can use the actors in any Blueprint.js component
by binding it to an object property. Here is an example of using the actor in 
a Blueprint.js controller.

```javascript
// app/controllers/hello.js

const { Controller, Action } = require ('@onehilltech/blueprint');
const { actor } = require ('@onehilltech/blueprint-dfinity');

/**
 * @class HelloController
 * 
 * This is a Blueprint.js controller. We are demonstrating how to bind a
 * Internet Computer actor to a property in the controller. You can bind
 * the Internet Computer actor to a property in any Blueprint.js object,
 * such as routers, services, and policies. 
 */
module.exports = Controller.extend ({
  /**
   * The default action for the controller.
   */
  __invoke () {
    return Action.extend ({
      /// Reference to the hello Internet Computer actor. The name parameter is 
      /// optional if the binding property and the target actor have the same name.
      hello: actor ('hello'),
      
      /**
       * Execute the action for this route.
       */
      async execute (req, res) {
        const { name } = req.body;
        
        // This invokes the greet action on the hello actor deployed in the default
        // canister.
        const message = await this.hello.greet (name);

        return res.status (200).json ( { message });
      }
    });
  }
});
```

> This controller is invoked when a route that has the controller action is executed.

If we bind this controller action to `POST /hello`, then this HTTP request will delegate
the request to the target Internet Computer actor.

## Define the configuration file

Define the `dfinity.js` configuration file in your Blueprint.js application. This
configuration file must contain, at a minimum, the `$default` agent and canister 
options as shown below.

```javascript
// app/configs/dfinity.js

module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000'
    }
  },

  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  }
};
```

## Run the application

You can now run the Blueprint.js application as normal.

    node ./app


What Next?
======================

Check out the `examples` directory for more use cases.

Happy Coding!
