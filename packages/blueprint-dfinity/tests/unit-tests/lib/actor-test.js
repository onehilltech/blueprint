const { Actor, update, query, IDL } = require ('../../../lib');
const { expect } = require ('chai');

const HttpAgent = require('@dfinity/agent').HttpAgent;

const HelloFactory = Actor.extend ({
  greet: update ('text', 'text'),
  greetq: query ('text', 'text'),
  whoami: query (undefined, 'principal'),
  record: query (undefined, { name: 'text' }),
});

describe ('lib | Actor', function () {
  it ('should define an actor', function () {
    expect (HelloFactory.prototype).to.have.property ('_idl_')
      .to.have.keys (['greet', 'greetq', 'whoami', 'record']);

    const hello = new HelloFactory ();
    expect (hello).to.have.property ('_idl_')
      .to.have.keys (['greet', 'greetq', 'whoami', 'record']);
  });

  it ('should create an actor instance', function () {
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const agent = new HttpAgent ({ host: 'http://localhost:8000' });

    const factory = new HelloFactory ();
    const hello = factory.createInstance ({ agent, canisterId });

    expect (hello).to.include.keys (['greet', 'greetq', 'whoami']);
  });
});