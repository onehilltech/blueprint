/**
 * Main entry point for the module.
 *
 * @param module
 */
module.exports = function (module) {
  module.app.defineType ('model', { location: 'models' });
  module.app.defineType ('policy', { location: 'policies' });
  module.app.defineType ('validator', { location: 'validators' });
  module.app.defineType ('sanitizer', { location: 'sanitizers' });
  module.app.defineType ('controller', { location: 'controllers' });
  module.app.defineType ('router', { location: 'routers' });
};
