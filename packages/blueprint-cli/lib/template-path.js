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

const path   = require ('path');
const { BO } = require ('base-object');
const chalk =  require ('chalk');

const {
  readFile,
  writeFile,
  ensureDir,
  ensureFile,
  readdir,
  stat
} = require ('fs-extra');

/**
 * @class TemplatePath
 */
const TemplatePath = BO.extend ({
  /// The Handlebars environment to use for generation.
  handlebars: null,

  /// Base path removed from filename when generating progress.
  basePath: null,

  /// The path where the template files are located.
  srcPath: null,

  /// The path where the files will be generated.
  outputPath: null,

  init () {
    this._super.call (this, ...arguments);

    if (!this.outputPath)
      this.outputPath = process.cwd ();

    if (!this.basePath)
      this.basePath = this.outputPath;
  },

  /**
   *  Generate files from the templates into the target directory.
   *
   * @param context
   * @return {*}
   */
  render (context) {
    return readdir (this.srcPath)
      .then (files => Promise.all (files.map (file => this._renderFile (file, context))));
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
  _renderFile (file, context) {
    let srcPath = path.resolve (this.srcPath, file);

    return stat (srcPath).then (stat => {
      if (stat.isDirectory ())
        return this._processDirectory (srcPath, file, context);
      else
        return this._processFile (srcPath, file, context);
    });
  },

  _processDirectory (srcPath, file, context) {
    // We need to create the target directory, and recurse into the directory
    // looking for more templates.
    return this._ensureDir (file, context).then ((dstPath) => {
      let templatePath = new TemplatePath ({
        handlebars: this.handlebars,
        basePath: this.basePath,
        srcPath,
        outputPath: dstPath
      });

      return templatePath.render (context);
    });
  },

  _processFile (srcFile, file, context) {
    return this._ensureFile (file, context).then ((dstFile) => {
      // This is a file. Let's run it through the template generator. Read the file
      // into member, then apply the current context to the template to create the
      // target concrete file.
      console.log (`  creating ${chalk.yellow (dstFile.slice (this.basePath.length + 1))}`);

      return readFile (srcFile, 'utf8').then (templateFile => {
        const compiled = this.handlebars.compile (templateFile);
        const content = compiled (context);

        return writeFile (dstFile, content);
      });
    });
  },

  _ensureDir (file, context) {
    const compiled = this.handlebars.compile (file);
    const content = compiled (context);

    let dstPath = path.resolve (this.outputPath, content);

    return ensureDir (dstPath).then (() => dstPath);
  },

  _ensureFile (file, context) {
    const compiled = this.handlebars.compile (file);
    const content = compiled (context);

    let dstFile = path.resolve (this.outputPath, content);

    return ensureFile (dstFile).then (() => dstFile);
  }
});

module.exports = TemplatePath;
