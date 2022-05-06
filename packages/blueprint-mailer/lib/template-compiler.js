const path = require ("path");
const gulp = require ("gulp");
const sass = require ("gulp-dart-sass");

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

  async compile (name) {
    const basename = path.resolve (this.templatePath, name);
    const pathname = basename + '.hbs';

    const exists = await fse.pathExists (pathname);

    if (!exists)
      return null;

    await this.compileScss (basename);
    const content = await fs.readFileAsync (pathname, 'utf-8');

    return this.handlebars.compile (content);
  }

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
}
