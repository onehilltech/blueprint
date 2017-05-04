'use strict';

const util      = require ('util')
  , Application = require ('../Application')
  ;

function WorkerApplication (appPath, messaging) {
  Application.call (this, appPath, messaging);
}

util.inherits (WorkerApplication, Application);

module.exports = WorkerApplication;
