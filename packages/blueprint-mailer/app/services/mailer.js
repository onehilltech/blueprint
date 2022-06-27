const { Service, computed, model } = require ('@onehilltech/blueprint');
const path = require ('path');
const Promise = require ('bluebird');
const fs = Promise.promisifyAll (require ('fs'));
const fse = require ('fs-extra');
const Handlebars = require ('handlebars');
const Email = require ('email-templates');
const _ = require ('lodash');

const juiceResources = require ('juice-resources-promise');

const MAILER_RESOURCE_PATH = 'resources/mailer';

const TemplateCompiler = require ('../../lib/template-compiler');

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

  // Reference to the email model.
  Email: model ('email'),

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
    this._configureEmailClient ();
    await this._configureTemplateCompiler ();
  },

  /**
   * Configure the email client used by the service.
   * @private
   */
  _configureEmailClient () {
    const options = _.merge ({}, this.app.configs.mailer, {
      render: this.render.bind (this),
    });

    this._email = new Email (options);
  },

  /**
   * Configure the template compiler used to compile email templates.
   *
   * @private
   */
  async _configureTemplateCompiler () {
    // Initialize the template compiler.
    const templatePath = path.resolve (this.mailerPath, 'templates');
    const handlebars = await this._initHandlebars ();
    this._templateCompiler = new TemplateCompiler (templatePath, handlebars);
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
    get () { return path.resolve (this.app.tempPath, MAILER_RESOURCE_PATH); }
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
    const result = await this._email.send (opts);

    // Create a document for the sent email.
    const { messageId, originalMessage: { subject, to, from, cc, bcc } } = result;
    return this.Email.create ({ message_id: messageId, type: template, to, from, cc, bcc, subject });
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
