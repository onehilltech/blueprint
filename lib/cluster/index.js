/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const os = require ('os');
const { isBoolean } = require ('lodash');
const { isMaster, fork } = require ('cluster');
const { BO } = require ('base-object');

/**
 * @class ClusterApplication
 *
 * The wrapper application for cluster mode.
 */
module.exports = BO.extend ({
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
    // the workers and masters sharing the same messaging framework.

    let app = new Application ({appPath: this.appPath});
    return app.configure ();
  }
});
