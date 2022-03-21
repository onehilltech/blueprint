const { update, query, Actor } = require ('../lib');

/**
 * @class HelloWorldActor
 *
 * This example was borrowed from:
 *
 *   https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169
 */
module.exports = Actor.extend ({
  /// Define the greet update method.
  greet: update ('text', 'text'),

  /// Define the green query method.
  greetq: query ('text', 'text'),

  /// Define the whoami method.
  whoami: query (null, 'principal'),
});

/**
 This version of the actor definition will be used once NodeJS supports decorators
 by default.

module.exports = class HelloActor extends Actor {
  @update ('text', 'text')
  greet;

  @query ('text', 'text')
  greetq;

  @query (null, 'principal')
  whoami;
}
 */
