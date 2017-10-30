'use strict';

const Blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = Blueprint.Listener.extend ({
  doEvent () {
    console.log ('The application is started.');
  }
});
