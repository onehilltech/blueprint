#!/usr/bin/env node

const {
  createApplicationAndStart
} = require ('@onehilltech/blueprint');

createApplicationAndStart (__dirname).then (() => {
  console.log ('The application is started');
}).catch (err => {
  console.error (err);
});
