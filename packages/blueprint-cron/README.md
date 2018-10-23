blueprint-cron
===============================

Blueprint module that adds cron job support to the application

## Features

* Define cron jobs as individual objects
* Wrapper for [node-cron](https://github.com/kelektiv/node-cron).

## Installation

    yarn add blueprint-cron
    
or

    npm install blueprint-cron --save
    
## Basic Usage

All cron jobs are located in `app/cronjobs`, and must extend the `Job` class
that can be imported from the `@onehilltech/blueprint-cron` module. The extended
`Job` class must define the `time` property, which is a [cron time pattern](http://crontab.org/),
and the `onTick()` method, which is called when the job is scheduled to run.

```javascript
// app/cronjobs/basic.js

const { Job } = require ('@onehilltech/blueprint-cron');

module.exports = Job.extend ({
  time: '* * * * * *',

  onTick () {
    
  }
});
```

Happy Coding!