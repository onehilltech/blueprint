module.exports = exports = {
  '/helloworld': {
    get: { action: 'ModuleTestController@helloWorld', options: {debug: true} },
  },

  '/module': [ function (req, res) {} ]
};