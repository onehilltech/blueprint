const os = require ('os');

const {
  isBoolean
} = require ('lodash');

const {
  isMaster,
  fork
} = require ('cluster');

const CoreObject = require ('../object');
const MessagingFramework = require ('../messaging/framework');

/**
 * @class ClusterApplication
 *
 * The wrapper application for cluster mode.
 */
module.exports = CoreObject.extend ({
  configure () {
    let Application;

    if (isMaster) {
      // This is the master process in the cluster. The master process needs to
      // fork N worker processes. It then need to create the master application
      // that will control the worker processes.
      const numCPUs =  os.cpus ().length;
      const clusterCount = isBoolean (this.cluster) ? numCPUs : this.cluster;

      if (clusterCount > numCPUs)
        console.warn ('*** warning: number of workers is greater than number of available CPUs');

      // We are going to fork N + 1 times because we want to have 1 master
      // application and N worker applications.

      for (let i = 0; i <= clusterCount; ++ i)
        fork ();

      Application = require ('./master-application');
    }
    else {
      Application = require ('./worker-application');
    }

    // Create the application, ignoring the messaging framework. We do not want
    // the workers and masters sharing the same messaing framework.

    let app = new Application ({appPath: this.appPath, messaging: new MessagingFramework ()});
    return app.configure ();
  }
});
