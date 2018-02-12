module.exports = {
  '/firebase': {
    '/devices': {
      resource: {
        controller: 'FirebaseMessagingController',
        allow: ['create'],
      },

      /*
       * Delete the registration for a device.
       */
      delete: {action: 'FirebaseMessagingController@removeDevice', policy: 'firebase.device.bearer'},

      '/tokens': {
        policy: 'firebase.device.bearer',

        /*
         * Refresh the device token. This is the token that is provided by the Firebase
         * SDK to the client application.
         */
        post: {action: 'FirebaseMessagingController@refreshToken'}
      },

      '/claims': {
        policy: 'firebase.device.bearer',

        /*
         * Claim an existing device.
         */
        post: {action: 'FirebaseMessagingController@claimDevice'},

        /*
         * Delete the claim for an existing device.
         */
        delete: {action: 'FirebaseMessagingController@unclaimDevice'}
      }
    }
  }
};
