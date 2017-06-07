validators
===========

This directory contains validators auto-loaded into the application, and 
available to request objects. Each file must export a single validator function
with the signature  ```function (str) => boolean``` value. For example:

```javascript
// isMongoIdOrMe.js
'use strict';

var validator = require ('validator')
  ;

module.exports = function (str) {
  return validator.isMongoId (str) || str === 'me';
}
```

More Details
------------

[Blueprint.js](https://github.com/onehilltech/blueprint) uses 
[express-validator](https://github.com/ctavan/express-validator#customvalidators)
to expose the customer validators on request objects.
