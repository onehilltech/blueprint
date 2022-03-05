const { Actor, update, query } = require ('../../../lib');
const { expect } = require ('chai');

const HttpAgent = require('@dfinity/agent').HttpAgent;

const HelloActor = Actor.extend ({
  greet: update ('text', 'text'),
  greetq: query ('text', 'text'),
  whoami: query (null, 'principal'),
});

describe ('lib | Actor', function () {
  it ('should define an actor', function () {
    expect (HelloActor.prototype).to.have.property ('_idl_')
      .to.include.keys (['greet', 'greetq', 'whoami']);

    const hello = new HelloActor ();
    expect (hello).to.have.property ('_idl_')
      .to.include.keys (['greet', 'greetq', 'whoami']);
  });

  it ('should create an actor instance', function () {
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const agent = new HttpAgent ({ host: 'http://localhost:8000' });

    const hello = new HelloActor ();
    hello.createInstance ({ agent, canisterId });
  });
});