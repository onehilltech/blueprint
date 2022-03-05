const { Actor, update, query } = require ('../../../lib');
const { expect } = require ('chai');

const HttpAgent = require('@dfinity/agent').HttpAgent;

const HelloActorFactory = Actor.extend ({
  greet: update ('text', 'text'),
  greetq: query ('text', 'text'),
  whoami: query (undefined, 'principal'),
});

describe ('lib | Actor', function () {
  it ('should define an actor', function () {
    expect (HelloActorFactory.prototype).to.have.property ('_idl_')
      .to.have.keys (['greet', 'greetq', 'whoami']);

    const hello = new HelloActorFactory ();
    expect (hello).to.have.property ('_idl_')
      .to.have.keys (['greet', 'greetq', 'whoami']);
  });

  it ('should create an actor instance', function () {
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const agent = new HttpAgent ({ host: 'http://localhost:8000' });

    const factory = new HelloActorFactory ();
    const hello = factory.createInstance ({ agent, canisterId });

    expect (hello).to.include.keys (['greet', 'greetq', 'whoami']);

  });
});