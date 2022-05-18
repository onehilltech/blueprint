module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000'
    },

    key: {
      host: 'http://localhost:8000',
      identify: 'key://./assets/dummy.pem'
    },

    phrase: {
      host: 'http://localhost:8000',
      identify: 'phrase://./assets/seed.txt'
    }
  },

  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  }
};
