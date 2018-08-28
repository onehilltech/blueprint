blueprint-compression
===============================

Blueprint module that adds compression support to Blueprint application

## Features

* Quickly add gzip support to Blueprint application.
* Wrapper for Express [compression](https://github.com/expressjs/compression) middleware.
* Compress all routes using a single configuration parameter.
* Apply compression to individual routes.

## Installation

    yarn add blueprint-compression
    
or

    npm install blueprint-compression --save
    
## Usage

All configuration options are the same as those passed to the 
[compression](https://github.com/expressjs/compression) middleware. The configuration 
file `app/configs/compression.js` is used to configure the 
compression Blueprint module. You can compress all routes in the application.

```javascript
// app/configs/compression.js

module.exports = {
  app: true  // or { options }
}
```

If you do not want to compress all routes, you can selectively compress
individual routes.

```javascript
// app/configs/compression.js

module.exports = {
  paths: {
    '/a/b': true,
    
    '/y/z': {
      // compression options
    }
  }
}
```

Happy Coding!