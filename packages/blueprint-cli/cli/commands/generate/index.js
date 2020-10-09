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

const path = require ('path');
const { readdir } = require ('fs-extra');
const { forOwn } = require ('lodash');
const handlebars = require ('handlebars');

const ProgramContext = require ('../../../lib/program-context');
const ModuleFinder = require ('../../../lib/module-finder');
const TemplatePath = require ('../../../lib/template-path');

const GeneratorFinder = ModuleFinder.extend ({
  program: null,

  /**
   * Handle the locating a blueprint module.
   *
   * @param modulePath
   */
  onBlueprintModuleFound (modulePath) {
    let basePath = path.resolve (modulePath, 'cli/generators');

    return readdir (basePath).then (files => {
      files.forEach (filename => {
        const generatorPath = path.resolve (basePath, filename);
        const generator = require (generatorPath).create ();

        // Create a new command for the generator. We are going to add the
        // description, options, and action to execute.
        let command = filename;

        if (generator.args && generator.args.length > 0)
          command += ` ${generator.args.join (' ')}`;

        let cmd = this.program.command (command);

        if (generator.description)
          cmd.description (generator.description);

        forOwn (generator.options, (description, flags) => cmd.option (flags, description));

        cmd.action (runGenerator (generatorPath, generator));
      });
    }).catch (err => {
      if (err.code !== 'ENOENT')
        return Promise.reject (err);
    });
  }
});

/**
 * Run the generator on the specified path.
 *
 * @param generatorPath
 * @param generator
 * @return {Function}
 */
function runGenerator (generatorPath, generator) {
  return function () {
    const args = [...arguments];
    const cmd = args.pop ();

    // Allow the generator to register its helpers.
    handlebars.registerHelper (generator.helpers);

    // Locate the files directory, and treat it as a template path. The
    // target directory for the files in the current working directory.
    const srcPath = path.resolve (generatorPath, 'files');
    let templates = new TemplatePath ({srcPath, handlebars});

    const context = new ProgramContext (Object.assign ({}, {args}, cmd));

    templates.render (context).catch (err => console.log (err));
  }
}

/**
 *
 */
class GenerateCommand extends Command {
  constructor () {
    super ('generate', 'run a code generator');
  }

  configure () {
    return new GeneratorFinder ({ program: this }).load ();
  }
}

module.exports = SimpleCommandFactory (GenerateCommand);
