'use strict';

let cors = require ('cors')
  ;

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'SEARCH']
};

module.exports = {
  '/v1': {
    use: [
      cors (corsOptions),
    ]
  }
};
