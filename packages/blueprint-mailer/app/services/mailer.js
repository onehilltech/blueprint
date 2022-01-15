const { Service, computed, BO } = require ('@onehilltech/blueprint');
const path = require ('path');
const Promise = require ('bluebird');
const fs = Promise.promisifyAll (require ('fs'));
const fse = require ('fs-extra');
const Handlebars = require ('handlebars');
const Email = require ('email-templates');
const _ = require ('lodash');

const gulp = require ('gulp');
const sass = require ('gulp-dart-sass');

const juiceResources = require ('juice-resources-promise');

const MAILER_ASSETS_PATH = 'assets/mailer';


/**
 * @class mailer
 */
module.exports = Service.extend ({
  /// The handlebars instance.
  _handlebars: null,

  /// Template cache.
  _templates: null,

  /// The template compiler
  _templateCompiler: null,

  _email: null,

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
    const options = _.merge ({}, this.app.configs.mailer, {
      render: this.render.bind (this),
    });

    // Initialize the email client.
    this._email = new Email (options);

    // Initialize the template compiler.
    const templatePath = path.resolve (this.mailerPath, 'templates');
    const handlebars = await this._initHandlebars ();
    this._templateCompiler = new TemplateCompiler ({ handlebars, templatePath });
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
  mailerPath: computed ({
    get () { return path.resolve (this.app.appPath, MAILER_ASSETS_PATH); }
  }),

  /**
   * Resolve a path relative to the mailer path.
   *
   * @returns {string}
   */
  resolve () {
    return path.resolve (this.mailerPath, ...arguments);
  },

  /**
   * Initialize the handlebars environment instance.
   *
   * @private
   */
  async _initHandlebars () {
    // Create a isolated handlebars environment for the mailer.
    this._handlebars = Handlebars.create ();

    // Load the handlebar resources for the mailer.
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
    const partialsPath = path.resolve (this.mailerPath, 'partials');
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
    const helpersPath = path.resolve (this.mailerPath, 'helpers');
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

  /**
   * Send an email.
   *
   * @param template    Name of the email template.
   * @param options     Options for email
   */
  async send (template, options) {
    const opts = Object.assign ({ template }, options);

    return this._email.send (opts);
  },

  /**
   * The render function for the mailer.
   *
   * @param templatePath
   * @param locals
   * @returns {Promise<string|*>}
   */
  async render (templatePath, locals) {
    const template = await this._lookupTemplate (templatePath);

    if (!template)
      return '';

    let res = template (locals, {
      allowProtoPropertiesByDefault: true
    });

    const [name, part] = templatePath.split ('/');

    if (part === 'html') {
      if (this._email.config.juice) {
        const juiceOptions = _.merge ({}, this._email.config.juiceResources || {}, {
          webResources: {
            relativeTo: path.resolve (this.mailerPath, 'templates', name)
          }
        });

        res = juiceResources (res, juiceOptions);
      }
    }

    return res;
  },

  async _lookupTemplate (path) {
    return this._templates[path] || (this._templates[path] = this._templateCompiler.compile (path));
  }
});

/**
 * @class TemplateCompiler
 *
 * Utility class responsible for compiling an email template for usage.
 */
const TemplateCompiler = BO.extend ({
  async compile (name) {
    const basename = path.resolve (this.templatePath, name);
    const pathname = basename + '.hbs';

    const exists = await fse.pathExists (pathname);

    if (!exists)
      return null;

    await this.compileScss (basename);
    const content = await fs.readFileAsync (pathname, 'utf-8');

    return this.handlebars.compile (content);
  },

  /**
   * Compile the sass/scss file, if one exists.
   *
   * @param basename
   */
  async compileScss (basename) {
    const pathname = basename + '.scss';
    const exists = await fse.pathExists (pathname);

    if (!exists)
      return null;

    return new Promise ((resolve, reject) => {
      gulp.src (pathname)
        .pipe (sass ({
          includePaths: [`${process.cwd ()}/node_modules`],
          quiet: true
        }).on ('error', reject))
        .pipe (gulp.dest (path.dirname (pathname)))
        .on ('end', resolve);
    });
  }
});
