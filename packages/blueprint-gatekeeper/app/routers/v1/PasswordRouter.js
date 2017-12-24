module.exports = {
  '/password': {
    '/reset': {
      get: 'PasswordController@getResetPasswordLink',
      post: 'PasswordController@resetPassword'
    },
  }
};
