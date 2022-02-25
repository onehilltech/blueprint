const { Service, computed } = require ('@onehilltech/blueprint');
const path = require ('path');
const Promise = require ('bluebird');
const fs = Promise.promisifyAll (require ('fs'));
const fse = require ('fs-extra');
const Handlebars = require ('handlebars');
const _ = require ('lodash');
const TemplateCompiler = require ('../../lib/template-compiler');

const HANDLEBARS_RESOURCE_PATH = 'resources/mailer';

/**
 * @class handlebars
 */
module.exports = Service.extend ({
  /**
   * Initialize the instance.
   */
  init () {
    this._super.call (this, ...arguments);
    this._templates = {};
  },

  /**
   * @override
   */
  async configure () {
    const handlebars = await this._initHandlebars ();
    this._templateCompiler = new TemplateCompiler (this.templatePath, handlebars);
  },

  /**
   * Get the registered templates.
   */
  templates: computed ({
    get () { return this._templates; }
  }),

  /**
   * Get the mailer path.
   */
  handlebarsPath: computed ({
    get () { return path.resolve (this.app.tempPath, HANDLEBARS_RESOURCE_PATH); }
  }),

  /**
   * Initialize the handlebars environment instance.
   *
   * @private
   */
  async _initHandlebars () {
    // Create a isolated handlebars environment for the service.
    this._handlebars = Handlebars.create ();

    // Load the handlebar resources.
    await Promise.all ([
      this._initHandlebarsPartials (),
      this._initHandlebarsHelpers ()
    ]);

    return this._handlebars;
  },

  /**
   * Load the partials into the handlebars environment.
   *
   * @private
   */
  async _initHandlebarsPartials () {
    const partialsPath = path.resolve (this.handlebarsPath, 'partials');
    const exists = await fse.pathExists (partialsPath);

    if (!exists)
      return;

    const files = await fs.readdirAsync (partialsPath);

    await Promise.all (files.map (async filename => {
      let name = filename.replace ('.hbs', '');
      let pathname = path.resolve (partialsPath, filename);

      const partial = await fs.readFileAsync (pathname, 'utf-8');
      this._handlebars.registerPartial (name, partial);
    }));
  },

  /**
   * Load the helpers into the handlebars environment.
   * @private
   */
  async _initHandlebarsHelpers () {
    const helpersPath = path.resolve (this.handlebarsPath, 'helpers');
    const exists = await fse.pathExists (helpersPath);

    if (!exists)
      return;

    const helpers = require ('require-all') ({
      dirname: helpersPath,
      filter: /^(.+)\.js$/,
      excludeDirs: /^\.(git|svn)$/,
      recursive: false
    });

    _.forEach (helpers, (value, key) => this._handlebars.registerHelper (key, value));
  },

  /// The handlebars instance.
  _handlebars: null,

  /// Template cache.
  _templates: null,

  /// The template compiler
  _templateCompiler: null,
});
