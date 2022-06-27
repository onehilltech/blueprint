/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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

const { Action, service, computed } = require ('@onehilltech/blueprint');
const path = require ('path');
const readline = require ('readline');
const fs = require ('fs-extra')

/**
 * @class EmberAppAction
 *
 * The base class for loading an EmberJS application.
 */
module.exports = Action.extend ({
  /// Reference to the handlebars service.
  handlebars: service (),

  /// The default location of the index file.
  indexPath: '../public_html/index.html',

  /**
   * @override
   */
  async configure () {
    await fs.ensureDir (this.tempPath);
    await this._compileIndexTemplate ();
  },

  /**
   * Execute the action.
   *
   * @param req         The request object
   * @param res         The response object
   */
  async execute (req, res) {
    // Get the model for the index page. The model will then be used to render
    // the html page we will send back to the client.

    const model = await this.model (req);
    const meta = await this.meta (req, model);
    const html = this.render ({ meta, model });

    return res.status (200).send (html);
  },

  /**
   * Get the model for the request.
   *
   * @param req           The request object
   */
  async model (req) {
    return null;
  },

  /**
   * Get the meta information for the request.
   *
   * @param req         The request object
   * @param model       The model for the request
   */
  async meta (req, model) {
    return null
  },

  /**
   * Render the model using the index template.
   *
   * @param model         Model used in rendering.
   */
  render (model) {
    return this._indexTemplate (model);
  },

  tempPath: computed ({
    get () { return  path.resolve (this.app.tempPath, 'emberjs'); }
  }),

  /**
   * Compile the index template.
   */
  async _compileIndexTemplate () {
    const indexFile = path.isAbsolute (this.indexPath) ? this.indexPath : path.resolve (this.app.appPath, this.indexPath);
    const tempTemplateFilePath = path.resolve (this.tempPath, 'index.hbs');

    // Copy each line of the index file to a temp file. We are going to add the
    // preload partial to the template file.

    const rl = readline.createInterface ({
      input: fs.createReadStream (indexFile),
      crlfDelay: Infinity
    });

    const tempTemplateFile = fs.createWriteStream (tempTemplateFilePath);

    for await (const line of rl) {
      if (line.includes ('</head>')) {
        // Before we close the head of the index file, we need to add our template parameters
        // that an be replaced when instantiating the template.

        tempTemplateFile.write ('{{> blueprint.head }}\n');
        tempTemplateFile.write ('{{#if model}}\n');
        tempTemplateFile.write ('    <meta name="model" content="{{encode-content model}}" />\n');
        tempTemplateFile.write ('{{/if}}\n');
      }

      tempTemplateFile.write (`${line}\n`);
    }


    tempTemplateFile.close ();
    rl.close ();

    this._indexTemplate = await this.handlebars.compile (tempTemplateFilePath);
  },


  /// The pre-compiled index template.
  _indexTemplate: null,
});
