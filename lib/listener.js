const Object = require ('./object')
  , assert   = require ('assert')
  ;

/**
 * @class Listener
 *
 * Base class for all listener objects in the Blueprint framework. A listener is
 * an object type can handle messages from other components, such as Controller,
 * Service, Router, etc.
 *
 * All listeners must implement the event() method.
 *
 * Listener objects are added to the framework in by exporting the class from a
 * file located in app/listeners. The name of the directory defines the event the
 * listener handles, and the name of the file defines the name of the listener.
 */
const Listener = Object.extend ({
  /**
   * Event handler for the listener. The number of arguments will depend on the
   * number of arguments passed to the emit() method.
   */
  event: null
});

module.exports = Listener;
