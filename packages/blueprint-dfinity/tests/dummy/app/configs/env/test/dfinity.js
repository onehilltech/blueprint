module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000'
    },

    seed: {
      host: 'http://localhost:8000',
      identify: 'phrase://./assets/seed.txt'
    },

    pem: {
      host: 'http://localhost:8000',
      identify: 'key://./assets/dummy.pem'
    }
  },

  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  }
};
