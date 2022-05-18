module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000'
    },

    key: {
      host: 'http://localhost:8000',
      identity: 'key://./assets/dummy.pem'
    },

    phrase: {
      host: 'http://localhost:8000',
      identity: 'phrase://./assets/seed.txt'
    }
  },

  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  }
};
