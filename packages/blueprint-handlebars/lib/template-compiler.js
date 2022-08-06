const fse = require ('fs-extra');
const Promise = require ('bluebird');
const fs = Promise.promisifyAll (require ('fs'));

/**
 * @class TemplateCompiler
 *
 * Utility class responsible for compiling an email template for usage.
 */
module.exports = class TemplateCompiler {
  constructor (templatePath, handlebars) {
    this.templatePath = templatePath;
    this.handlebars = handlebars;
  }

  /**
   * Compile the template.
   *
   * @param path        Path to template file.
   */
  async compile (path) {
    const exists = await fse.pathExists (path);

    if (!exists)
      return null;

    const content = await fs.readFileAsync (path, 'utf-8');
    return this.handlebars.compile (content);
  }
}
