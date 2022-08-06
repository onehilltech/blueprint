/*
 * Copyright (c) 2020 One Hill Technologies, LLC
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

const { SimpleCommandFactory, Command } = require ('../../../lib');

const path    = require ('path');
const ora     = require ('ora');
const handlebars = require ('handlebars');

const { ensureDir } = require ('fs-extra');
const { kebabCase } = require ('lodash');
const { execFile, spawn } = require ('child_process');
const { fromCallback } = require ('bluebird');
const { EntityGenerator, TemplatePath, ProgramContext } = require ('../../../lib');

const run = process.platform === 'win32' ? spawn : execFile;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const NewGenerator = EntityGenerator.extend ({
  helpers: {
    normalizedProjectName () {
      return kebabCase (this.args[0]);
    }
  }
});

class NewCommand extends Command {
  constructor () {
    super ('new', 'create a new Blueprint application');

    this.arguments ('<name>')
      .option ('-o, --output-path [path]', 'output path [./]', './')
      .option ('--ver [ver]', 'version number [0.0.1]', '0.0.1')
      .option ('--license [license]', 'distribution license [Apache-2.0]', 'Apache-2.0');
  }

  execute (name) {
    let srcPath = path.resolve (__dirname, './templates');
    let outputPath = path.resolve (this.outputPath, kebabCase (name));

    let generator = new NewGenerator ();
    generator.registerHelpers (handlebars);

    return ensureDir (outputPath).then (() => {
      console.log ('blueprint: generating the application; please be patient...');

      // Define the view used to render the templates, then render the templates with
      // this view of the system.
      let context = new ProgramContext (this);
      let templates = new TemplatePath ({handlebars, srcPath, outputPath, basePath: outputPath});

      return templates.render (context);
    }).then (() => {
      const commands = [
        [ 'install', '@onehilltech/blueprint', 'pug'],
        [ 'install', '@onehilltech/blueprint-testing', '@onehilltech/blueprint-cli', '--save-dev'],
        [ 'bin' ]
      ];

      let promises = Promise.all (commands.map (command => fromCallback (callback => run (npm, command, {cwd: outputPath}, callback))));
      ora.promise (promises, 'installing node modules...');

      return promises;
    }).then (() => {
      console.log ('Happy Coding!')
    }).catch (err => console.error (err.message))
  }
}

module.exports = SimpleCommandFactory (NewCommand);
