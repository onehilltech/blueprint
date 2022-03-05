sanitizers
===========

This directory contains sanitizers auto-loaded into the application, and 
available to request objects. Each file must export a single s function
with the signature ```function (str) => [*]```. For example:

```javascript
// toUpperCase.js
'use strict';

module.exports = function (str) {
  return str.toUpperCase ()
}
```

More Details
------------

[Blueprint.js](https://github.com/onehilltech/blueprint) uses 
[express-validator](https://github.com/ctavan/express-validator#customsanitizers)
to expose the customer sanitizers on request objects.
