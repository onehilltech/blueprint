module.exports = {
  agents: {
    $default: {
      host: 'http://localhost:8000'
    },
    key: {
      host: 'http://localhost:8000',
      privateKey: './assets/dummy.pem'
    },
    phrase: {
      host: 'http://localhost:8000',
      phrase: './assets/seed.txt'
    }
  },
  canisters: {
    $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai'
  }
};