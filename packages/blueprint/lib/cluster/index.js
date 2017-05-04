'use strict';

const os    = require ('os')
  , cluster = require ('cluster')
  , _       = require ('underscore')
  ;

function createApplicationForCluster (appPath, messaging, opts) {
  var Application;

  if (cluster.isMaster) {
    // This is the master process in the cluster. The master process needs to
    // fork N worker processes. It then need to create the master application
    // that will control the worker processes.
    const numCPUs =  os.cpus ().length;
    const clusterCount = _.isBoolean (opts) ? numCPUs : opts;

    if (clusterCount > numCPUs)
      console.warn ('Cluster size is greater than number of available CPUs');

    for (var i = 0; i < clusterCount; ++ i)
      cluster.fork ();

    Application = require ('./MasterApplication');
  }
  else {
    Application = require ('./WorkerApplication');
  }

  return new Application (appPath, messaging);
}

module.exports = createApplicationForCluster;
