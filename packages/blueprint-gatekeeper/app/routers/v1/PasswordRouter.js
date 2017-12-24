module.exports = {
  '/password': {
    '/forgot': {
      post: 'PasswordController@forgotPassword',
    },
    '/reset': {
      post: 'PasswordController@resetPassword'
    },
  }
};
