var path    = require ('path')
  , all     = require ('require-all')
  , winston = require ('winston')
  , fs      = require ('fs')
  , extend  = require ('extend')
  ;

function getConfigs (configPath, env, callback) {
  winston.log ('info', 'configuration path: %s', configPath);
  winston.log ('info', 'configuration environment: %s', env);

  var filter = /(.+)\.config\.(js|json)$/;

  // Load the global/default configurations. Basically, do not
  // do into any subdirectories.
  var configs = all ({
    dirname     :  configPath,
    filter      :  filter,
    excludeDirs :  /.*/,
  });

  var envConfigPath = path.join (configPath, env);

  fs.stat (envConfigPath, function (err, stats) {
    if (err) return callback (null, configs);

    if (stats.isDirectory ()) {
      // Load the configurations specific to the environment.
      var envConfigs = all({
        dirname: envConfigPath,
        filter: filter,
        excludeDirs: /.*/,
      });
    }

    // Extend the default configurations with the ones loaded from the environment
    // configurations. The environment configurations will overwrite the configuration
    // values in the default configurations.
    configs = extend (true, configs, envConfigs);
    return callback (null, configs);
  });
}

module.exports = exports = getConfigs;
