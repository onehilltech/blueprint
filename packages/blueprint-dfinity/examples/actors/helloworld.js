const { update, query, Actor } = require ('../lib');

module.exports = Actor.extend ({
  greet: update ('text', 'text'),
  greetq: query ('text', 'text'),
  whoami: query (null, 'principal'),
});

/*
const idlFactory = ({ IDL }) => {
  return IDL.Service ({
    'greet': IDL.Func([IDL.Text], [IDL.Text], []),
    'greetq': IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'whoami': IDL.Func([], [IDL.Principal], ['query']),
  });
};
*/