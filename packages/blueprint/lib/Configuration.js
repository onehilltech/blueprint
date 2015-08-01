var extend  = require ('extend')
  , path    = require ('path')
  , all     = require ('require-all')
  , winston = require ('winston')
  , fs      = require ('fs')
  ;

module.exports = exports = function (configPath, env) {
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

  try {
    lstat = fs.lstatSync(envConfigPath);

    if (lstat.isDirectory()) {
      // Load the configurations specific to the environment.
      var envConfigs = all({
        dirname: envConfigPath,
        filter: filter,
        excludeDirs: /.*/,
      });

      // Extend the default configurations with the ones loaded from the environment
      // configurations. The environment configurations will overwrite the configuration
      // values in the default configurations.
      configs = extend(true, configs, envConfigs);
    }
  }
  catch (ex) {
    // Do nothing. The directory does not exist.
  }

  return configs;
};
