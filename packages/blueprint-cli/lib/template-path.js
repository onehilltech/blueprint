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

const handlebars = require ('handlebars');
const path   = require ('path');
const { BO } = require ('base-object');
const chalk =  require ('chalk');

const {
  readFile,
  writeFile,
  ensureDir,
  readdir,
  stat
} = require ('fs-extra');

/**
 * @class TemplatePath
 */
const TemplatePath = BO.extend ({
  basePath: null,

  srcPath: null,

  init () {
    this._super.call (this, ...arguments);

    if (!this.basePath)
      this.basePath = this.srcPath;
  },

  /**
   *  Generate files from the templates into the target directory.
   *
   * @param outPath
   * @param context
   * @return {*}
   */
  render (outPath, context) {
    return readdir (this.srcPath)
      .then (files => Promise.all (files.map (file => this._renderFile (outPath, file, context))));
  },

  /**
   * Helper to render a single file/directory.
   *
   * @param outPath
   * @param file
   * @param context
   * @return {*}
   * @private
   */
  _renderFile (outPath, file, context) {
    let srcPath = path.resolve (this.srcPath, file);
    let dstPath = path.resolve (outPath, file);

    return stat (srcPath).then (stat => {
      if (stat.isDirectory ()) {
        // We need to create the target directory, and recurse into the directory
        // looking for more templates.
        return ensureDir (dstPath).then (() => {
          let templatePath = new TemplatePath ({basePath: this.basePath, srcPath});
          return templatePath.render (dstPath, context);
        });
      }
      else {
        // This is a file. Let's run it through the template generator. Read the file
        // into member, then apply the current context to the template to create the
        // target concrete file.
        console.log (`  creating ${chalk.yellow (srcPath.slice (this.basePath.length + 1))}`);

        return readFile (srcPath, 'utf8').then (templateFile => {
          const compiled = handlebars.compile (templateFile);
          const content = compiled (context);

          return writeFile (dstPath, content);
        });
      }
    });
  }
});

module.exports = TemplatePath;
