const { BlueprintObject, computed } = require ('@onehilltech/blueprint');
const path = require ('path');
const fs = require ('fs-extra');
const { fromCallback } = require ('bluebird');

module.exports = BlueprintObject.extend ({
  tempPath: null,

  name: null,

  exists () {
    return fs.pathExists (this.fileName);
  },

  existsSync () {
    return fs.pathExistsSync (this.fileName);
  },

  dirName: computed ({
    get ( ) {
      return path.resolve (this.tempPath, `schedules/${this.name}`);
    }
  }),

  fileName: computed ({
    get ( ) {
      return path.resolve (this.tempPath, `${this.dirName}/last_time_run.date`);
    }
  }),

  updateSync (runAt) {
    fs.ensureDirSync (this.dirName);

    const content = runAt.getTime ();
    fs.writeFileSync (this.fileName, content);
  },
});