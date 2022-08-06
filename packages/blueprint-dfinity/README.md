blueprint-dfinity
================================

A Blueprint.js module for interface with the Internet Computer from NodeJS


Installation
=============

    npm install @onehilltech/blueprint-dfinity --save


Usage
========

Getting Started
-------------------

This walkthrough uses Blueprint.js to invoke the actor from the
[Hello World](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins/) 
example. The Internet Computer must be running in your local development environment, and the 
actor must be deployed to a canister within this environment.

> If you are new to the Internet Computer, we strongly encourage you to review the 
> Hello World example referenced above before continuing.


### Defining the actor(s)

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


### Using the actor in Blueprint.js components

After defining your actors, you can use the actors in any Blueprint.js component
by binding it to an object property. Here is an example of using the `hello` actor 
in a Blueprint.js controller.

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
       * @override
       */
      async execute (req, res) {
        const { name } = req.body;
        
        // This invokes greet action on the hello actor deployed in the default canister.
        const message = await this.hello.greet (name);

        return res.status (200).json ( { message });
      }
    });
  }
});
```

If we bind this controller action to `POST /hello`, then this HTTP request will delegate
the request to the target Internet Computer actor.


### Define the configuration file

Lastly, define the `dfinity.js` configuration file. This configuration file must contain, at a 
minimum, the `$default` agent and canister options as shown below.

```javascript
// app/configs/dfinity.js

module.exports = {
  agents: {
    // This is the default named agent. It will be used if you do not explicitly
    // provide a named agent in the actor binding (see advanced usage below).
    
    $default: {
      // This property is required. It must be set to the location of the dfx server.
      host: 'http://localhost:8000'               
    }
  },

  canisters: {
    // This is the default named canister. It will be used if you do not explicitly
    // provide a named canister in the actor binding (see advanced usage below).
    
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',   
  }
};
```

## Run the application

You can now run the Blueprint.js application as normal.

    node ./app

## Advanced Usage

### Binding to named agents and canisters

You can explicitly bind to a named agent and canister instead of always binding to
the default ones. First, define the named agent and/or canister in your `dfinity.js` 
configuration file.

```javascript
// app/configs/dfinity.js

module.exports = {
  agents: {
    // This is the default named agent. It will be used if you do not explicitly
    // provide a named agent in the actor binding (see advanced usage below).
    
    $default: {
      // This property is required. It must be set to the location of the dfx server.
      host: 'http://localhost:8000'               
    },
    
    other: {
      host: 'http://localhost:8080'
    }
  },

  canisters: {
    // This is the default named canister. It will be used if you do not explicitly
    // provide a named canister in the actor binding (see advanced usage below).
    
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
    friends: 'rrkah-fqaaa-aaaaa-aaaaq-caj',
  }
};
```

In the example above, we created a named agent labeled `other`, and a named canister
labeled `friends`. Now, we can use either in our `actor` binding.

```javascript
// app/controllers/hello.js

const { Controller, Action } = require ('@onehilltech/blueprint');
const { actor } = require ('../../../../lib');

module.exports = Controller.extend ({
  /**
   * The default action for the controller.
   */
  __invoke () {
    return Action.extend ({
      /// Bind to a named agent and a named canister. We do not have to provide
      /// both a named agent and canister. When we do not provide one, the default
      /// is used.
      
      hello: actor ('hello', { agent: 'other', canisterId: 'friends' }),

      /// ...
    });
  }
})
```

### Using your own private key or phrase

The default behavior of this module is to auto-generate a private key for your
application. This key is used as the default key for all agents. You can supply
your own private key or phrase instead of using the default private key we create.
You use your own private key by setting the `privateKey` property in the configuration
file, or your own phrase by setting the `phrase` property in the configuration file.

```javascript
// app/configs/dfinity.js

module.exports = {
  privateKey: 'path to private key file',
  phrase: 'path to phrase file',
  
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

The value of `privateKey` and `phrase` is absolute or relative path. Also, the `privateKey`
property takes precedence over the `phrase` property.

> Set `privateKey: false` to disable generation of the default private key.

You can also override the private key and/or phrase for each agent by setting the `privateKey`
and/or `phrase` property within its scope.

```javascript
// app/configs/dfinity.js

module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000',
      privateKey: 'path to private key file',
    }
  },

  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  }
};
```

In the example above, we will auto-generate the default private key. But, the `$default` agent
will not use the default private key.

Happy Coding!
