const {
  SingleFileUploadAction,
  Controller,
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  uploadImage () {
    return SingleFileUploadAction.extend ({
      name: 'image',

      onUploadComplete (req, res) {
        res.status (200).render ('helloworld.pug', {file: req.file});
      }
    });
  }
});
